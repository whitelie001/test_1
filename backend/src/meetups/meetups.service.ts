import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated } from '../common/dto/paginated.dto';
import {
  ForbiddenApiException,
  MeetupFullException,
  MeetupNotFoundException,
} from '../common/exceptions/pium-api.exception';
import { classifyMeetupType } from './domain/meetup-type-classifier';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { UpdateMeetupDto } from './dto/update-meetup.dto';
import { ListMeetupsQueryDto } from './dto/list-meetups-query.dto';
import { JoinMeetupDto } from './dto/join-meetup.dto';

const MEETUP_TYPE_LABEL: Record<string, 'small' | 'large'> = {
  소모임: 'small',
  대모임: 'large',
};

@Injectable()
export class MeetupsService {
  constructor(private readonly prisma: PrismaService) {}

  /// 지도 반경 내 모임 목록. 거리 계산은 PostGIS 없이 순수 SQL Haversine 공식을 쓴다
  /// (이 샌드박스 Postgres엔 PostGIS 미설치, 이 정도 쿼리량엔 충분).
  ///
  /// 문서에 있는 `time_slot`/`growth_level` 필터는 아직 적용하지 않는다:
  /// growth_level은 GrowthModule(Phase 4)이 있어야 계산 가능하고, time_slot은
  /// `schedule` JSON의 정확한 형태가 문서에 정의돼 있지 않아 임의로 추측해
  /// 필터링하지 않는다. 두 파라미터는 DTO에서 받아두되 지금은 무시한다.
  async list(query: ListMeetupsQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const type = query.type ? MEETUP_TYPE_LABEL[query.type] : undefined;

    // 거리+필터를 모두 반영한 결과 집합. 목록 조회와 total 카운트가 같은
    // 집합을 세도록 서브쿼리를 공유한다(그렇지 않으면 반경 밖인데 total>0
    // 처럼 meta와 data가 어긋난다).
    const filtered = Prisma.sql`
      SELECT id, distance_meters FROM (
        SELECT id,
          6371000 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians(${query.lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${query.lng}))
              + sin(radians(${query.lat})) * sin(radians(lat))
            ))
          ) AS distance_meters
        FROM meetups
        WHERE (${query.sport}::text IS NULL OR sport = ${query.sport})
          AND (${query.level}::text IS NULL OR level = ${query.level})
          AND (${type ?? null}::text IS NULL OR meetup_type = ${type ?? null}::"MeetupType")
      ) sub
      WHERE distance_meters <= ${query.radius}
    `;

    const [rows, totalRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ id: string; distance_meters: number }>>(
        Prisma.sql`${filtered} ORDER BY distance_meters ASC OFFSET ${skip} LIMIT ${query.limit}`,
      ),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(
        Prisma.sql`SELECT COUNT(*) AS count FROM (${filtered}) counted`,
      ),
    ]);

    const ids = rows.map((r) => r.id);
    const meetups = await this.prisma.meetup.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(meetups.map((m) => [m.id, m]));
    const total = Number(totalRows[0]?.count ?? 0);

    return new Paginated(
      ids.map((id) => byId.get(id)).filter((m) => m !== undefined),
      { page: query.page, limit: query.limit, total },
    );
  }

  async getById(id: string) {
    const meetup = await this.prisma.meetup.findUnique({
      where: { id },
      include: { host: true },
    });
    if (!meetup) throw new MeetupNotFoundException();
    return meetup;
  }

  async create(hostId: string, dto: CreateMeetupDto) {
    return this.prisma.meetup.create({
      data: {
        hostId,
        name: dto.name,
        sport: dto.sport,
        description: dto.description,
        maxMembers: dto.max_members,
        meetupType: classifyMeetupType(dto.max_members),
        lat: dto.lat,
        lng: dto.lng,
        locationName: dto.location_name,
        schedule: dto.schedule as Prisma.InputJsonValue,
        level: dto.level,
        fee: dto.fee,
        members: {
          create: { userId: hostId, role: 'host' },
        },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateMeetupDto) {
    const meetup = await this.getById(id);
    if (meetup.hostId !== userId) throw new ForbiddenApiException();

    return this.prisma.meetup.update({
      where: { id },
      data: {
        name: dto.name,
        sport: dto.sport,
        description: dto.description,
        maxMembers: dto.max_members,
        meetupType: dto.max_members
          ? classifyMeetupType(dto.max_members)
          : undefined,
        lat: dto.lat,
        lng: dto.lng,
        locationName: dto.location_name,
        schedule: dto.schedule as Prisma.InputJsonValue | undefined,
        level: dto.level,
        fee: dto.fee,
      },
    });
  }

  async remove(id: string, userId: string) {
    const meetup = await this.getById(id);
    if (meetup.hostId !== userId) throw new ForbiddenApiException();
    await this.prisma.meetup.delete({ where: { id } });
  }

  async join(id: string, userId: string, dto: JoinMeetupDto) {
    const meetup = await this.getById(id);

    const existing = await this.prisma.meetupMember.findFirst({
      where: { meetupId: id, userId, leftAt: null },
    });
    if (existing) {
      return { status: 'joined', member_count: meetup.currentMembers };
    }

    if (meetup.currentMembers >= meetup.maxMembers) {
      throw new MeetupFullException();
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.meetupMember.create({
        data: { meetupId: id, userId, joinMessage: dto.message },
      }),
      this.prisma.meetup.update({
        where: { id },
        data: { currentMembers: { increment: 1 } },
      }),
    ]);

    return { status: 'joined', member_count: updated.currentMembers };
  }

  async leave(id: string, userId: string) {
    const member = await this.prisma.meetupMember.findFirst({
      where: { meetupId: id, userId, leftAt: null },
    });
    if (!member) throw new ForbiddenApiException();

    await this.prisma.$transaction([
      this.prisma.meetupMember.update({
        where: { id: member.id },
        data: { leftAt: new Date() },
      }),
      this.prisma.meetup.update({
        where: { id },
        data: { currentMembers: { decrement: 1 } },
      }),
    ]);
  }

  async listMembers(id: string, page: number, limit = 20) {
    const where = { meetupId: id, leftAt: null };
    const [members, total] = await Promise.all([
      this.prisma.meetupMember.findMany({
        where,
        include: { user: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.meetupMember.count({ where }),
    ]);

    return new Paginated(members, { page, limit, total });
  }

  /// 역할 변경은 호스트만 가능(문서 5.3절: "호스트 → 공동호스트(부팀장) 지정").
  async updateMemberRole(
    meetupId: string,
    actingUserId: string,
    targetUserId: string,
    role: 'host' | 'co_host' | 'member',
  ) {
    const meetup = await this.getById(meetupId);
    if (meetup.hostId !== actingUserId) throw new ForbiddenApiException();

    const member = await this.prisma.meetupMember.findFirst({
      where: { meetupId, userId: targetUserId, leftAt: null },
    });
    if (!member) throw new ForbiddenApiException();

    const updated = await this.prisma.meetupMember.update({
      where: { id: member.id },
      data: { role },
    });
    return { user_id: updated.userId, role: updated.role };
  }

  /// role 필터는 문서상 host/member 2값뿐이라, 'member'는 co_host를 포함한
  /// "호스트가 아닌 모든 참여"로 취급한다.
  async listMyMeetups(userId: string, role?: 'host' | 'member') {
    const memberWhere: Prisma.MeetupMemberWhereInput = {
      userId,
      leftAt: null,
      ...(role === 'host' ? { role: 'host' } : {}),
      ...(role === 'member' ? { role: { not: 'host' } } : {}),
    };

    const memberships = await this.prisma.meetupMember.findMany({
      where: memberWhere,
      include: { meetup: true },
    });

    return memberships.map((m) => m.meetup);
  }
}
