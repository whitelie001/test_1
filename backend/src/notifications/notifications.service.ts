import { Inject, Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated } from '../common/dto/paginated.dto';
import { PUSH_PROVIDER } from './push/push-provider.interface';
import type { PushProvider } from './push/push-provider.interface';

const PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private readonly pushProvider: PushProvider,
  ) {}

  async list(userId: string, isRead: boolean | undefined, page: number) {
    const where = { userId, ...(isRead === undefined ? {} : { isRead }) };
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return new Paginated(
      {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          payload: n.payload,
          is_read: n.isRead,
          created_at: n.createdAt,
        })),
      },
      { page, limit: PAGE_SIZE, total },
    );
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return null;
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return null;
  }

  /// 다른 모듈(성장/체크인 등)이 알림을 발생시킬 때 호출하는 내부 API.
  /// `notifications` 테이블에 항상 적재하고, 등록된 기기 토큰이 있으면
  /// PushProvider로도 발송한다(개발 기본값은 NoopPushProvider).
  async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;
    await this.pushProvider.send(
      tokens.map((t) => t.token),
      title,
      body,
      payload,
    );
  }

  /// 모임 멤버 전원에게 알림을 발생시킬 때 사용(성장 단계 달성 등).
  async notifyMeetupMembers(
    meetupId: string,
    type: NotificationType,
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const members = await this.prisma.meetupMember.findMany({
      where: { meetupId, leftAt: null },
      select: { userId: true },
    });
    await Promise.all(
      members.map((m) => this.notifyUser(m.userId, type, title, body, payload)),
    );
  }
}
