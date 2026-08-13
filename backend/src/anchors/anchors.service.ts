import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnchorNotAuthorizedException,
  AnchorTimeExceededException,
  ForbiddenApiException,
  MeetupNotFoundException,
} from '../common/exceptions/pium-api.exception';
import { isAnchorDisconnected } from './domain/anchor-failover-resolver';
import {
  ANCHOR_VALID_WINDOW_MINUTES,
} from './domain/anchor-constants';
import { AnchorLocationDto } from './dto/anchor-location.dto';

@Injectable()
export class AnchorsService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(meetupId: string, userId: string, dto: AnchorLocationDto) {
    const meetup = await this.prisma.meetup.findUnique({
      where: { id: meetupId },
    });
    if (!meetup) throw new MeetupNotFoundException();

    const membership = await this.prisma.meetupMember.findFirst({
      where: { meetupId, userId, leftAt: null },
    });
    if (!membership || (membership.role !== 'host' && membership.role !== 'co_host')) {
      throw new AnchorNotAuthorizedException();
    }

    const now = new Date();
    const existing = await this.prisma.anchor.findFirst({
      where: { meetupId, status: 'active' },
      orderBy: { activatedAt: 'desc' },
    });

    let failoverFromAnchorId: string | null = null;
    if (existing) {
      const disconnected = isAnchorDisconnected(existing.lastPingAt, now);
      await this.prisma.anchor.update({
        where: { id: existing.id },
        data: { status: disconnected ? 'disconnected' : 'expired' },
      });
      if (disconnected) failoverFromAnchorId = existing.id;
    }

    const validUntil = new Date(
      now.getTime() + ANCHOR_VALID_WINDOW_MINUTES * 60 * 1000,
    );

    const anchor = await this.prisma.anchor.create({
      data: {
        meetupId,
        activatedBy: userId,
        lat: dto.lat,
        lng: dto.lng,
        status: 'active',
        activatedAt: now,
        validFrom: now,
        validUntil,
        lastPingAt: now,
        failoverFromAnchorId,
      },
    });

    return { anchor_id: anchor.id, activated_at: anchor.activatedAt, expires_at: anchor.validUntil };
  }

  async updateLocation(anchorId: string, userId: string, dto: AnchorLocationDto) {
    const anchor = await this.prisma.anchor.findUnique({ where: { id: anchorId } });
    if (!anchor) throw new AnchorNotAuthorizedException();
    if (anchor.activatedBy !== userId) throw new ForbiddenApiException();

    const now = new Date();
    if (anchor.status !== 'active' || now > anchor.validUntil) {
      throw new AnchorTimeExceededException();
    }

    const updated = await this.prisma.anchor.update({
      where: { id: anchorId },
      data: { lat: dto.lat, lng: dto.lng, lastPingAt: now },
    });

    return { anchor_id: updated.id, updated_at: updated.lastPingAt };
  }

  /// 모임에 현재 유효한(만료되지 않은) 활성 앵커를 찾는다. 체크인 로직에서
  /// 앵커 모드 대상 위치를 결정하는 데 쓰인다.
  async getActiveAnchorForMeetup(meetupId: string) {
    const now = new Date();
    return this.prisma.anchor.findFirst({
      where: { meetupId, status: 'active', validUntil: { gte: now } },
      orderBy: { activatedAt: 'desc' },
    });
  }
}
