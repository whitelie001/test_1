import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createPiumValidationPipe } from '../src/common/pipes/pium-validation-pipe';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Notifications + Events (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();

  const MEETUP_LAT = 37.5665;
  const MEETUP_LNG = 126.978;
  const INSIDE_100M = { lat: 37.5665, lng: 126.9785 }; // 약 44m

  async function loginAs(kakaoToken: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    return {
      accessToken: res.body.data.access_token as string,
      userId: res.body.data.user.id as string,
    };
  }

  async function createMeetup(accessToken: string, name: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sport: '러닝',
        max_members: 10,
        lat: MEETUP_LAT,
        lng: MEETUP_LNG,
        location_name: '한강공원',
        schedule: { day: '월', time: '19:00' },
      });
    return res.body.data.id as string;
  }

  /// 1시간 체류를 실제로 기다리지 않고, 체크인 → range_state_changed_at을
  /// 과거로 되돌린 뒤 퇴장까지 완료시켜 checkin_completed 알림을 유발한다.
  async function completeCheckinFlow(accessToken: string, meetupId: string) {
    const enter = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/checkin/enter`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(INSIDE_100M)
      .expect(201);
    const checkinId = enter.body.data.checkin_id as string;

    await prisma.checkin.update({
      where: { id: checkinId },
      data: {
        isInRange: true,
        rangeStateChangedAt: new Date(Date.now() - 70 * 60 * 1000),
        outOfRangeSince: null,
      },
    });

    await request(app.getHttpServer())
      .post(`/v1/checkins/${checkinId}/exit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(INSIDE_100M)
      .expect(201);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(createPiumValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const testUserFilter = { kakaoId: { startsWith: `mock-e2e-notif-${runId}` } };
    await prisma.notification.deleteMany({ where: { user: testUserFilter } });
    await prisma.checkin.deleteMany({ where: { user: testUserFilter } });
    await prisma.growthHistory.deleteMany({ where: { meetup: { host: testUserFilter } } });
    await prisma.meetupSession.deleteMany({ where: { meetup: { host: testUserFilter } } });
    await prisma.meetupMember.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetup.deleteMany({ where: { host: testUserFilter } });
    await prisma.user.deleteMany({ where: testUserFilter });
    await prisma.event.deleteMany({ where: { name: { startsWith: `e2e-event-${runId}` } } });
    await app.close();
  });

  it('체크인 완료 시 checkin_completed 알림이 쌓이고, 목록/읽음 처리 API가 동작한다', async () => {
    const host = await loginAs(`e2e-notif-${runId}-host`);
    const meetupId = await createMeetup(host.accessToken, '알림 테스트 모임');

    await completeCheckinFlow(host.accessToken, meetupId);

    const list = await request(app.getHttpServer())
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    const notifications = list.body.data.notifications as Array<{
      id: string;
      type: string;
      is_read: boolean;
    }>;
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    const completed = notifications.find((n) => n.type === 'checkin_completed');
    expect(completed).toBeDefined();
    expect(completed!.is_read).toBe(false);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(1);

    const unreadOnly = await request(app.getHttpServer())
      .get('/v1/notifications')
      .query({ is_read: false })
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(
      (unreadOnly.body.data.notifications as Array<{ is_read: boolean }>).every((n) => !n.is_read),
    ).toBe(true);

    await request(app.getHttpServer())
      .put(`/v1/notifications/${completed!.id}/read`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);

    const afterRead = await request(app.getHttpServer())
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    const readNotif = (afterRead.body.data.notifications as Array<{ id: string; is_read: boolean }>).find(
      (n) => n.id === completed!.id,
    );
    expect(readNotif!.is_read).toBe(true);

    await request(app.getHttpServer())
      .put('/v1/notifications/read-all')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);

    const afterReadAll = await request(app.getHttpServer())
      .get('/v1/notifications')
      .query({ is_read: false })
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(afterReadAll.body.data.notifications).toHaveLength(0);
  });

  it('성장 단계 달성 시 모임 멤버 전원에게 growth_achieved 알림이 간다', async () => {
    const host = await loginAs(`e2e-notif-${runId}-growth-host`);
    const member = await loginAs(`e2e-notif-${runId}-growth-member`);
    const meetupId = await createMeetup(host.accessToken, '성장 알림 모임');

    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/join`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(201);

    for (let daysAgo = 5; daysAgo >= 1; daysAgo--) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - daysAgo);
      date.setUTCHours(0, 0, 0, 0);
      const session = await prisma.meetupSession.create({
        data: { meetupId, sessionDate: date, status: 'completed' },
      });
      await prisma.checkin.create({
        data: {
          sessionId: session.id,
          userId: host.userId,
          status: 'completed',
          enteredAt: date,
          exitedAt: date,
          isInRange: false,
          elapsedSeconds: 3900,
          rangeStateChangedAt: date,
          date,
          piumScoreEarned: 5,
        },
      });
    }

    await request(app.getHttpServer()).get(`/v1/meetups/${meetupId}/growth`).expect(200);

    const memberNotifs = await request(app.getHttpServer())
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);
    expect(
      (memberNotifs.body.data.notifications as Array<{ type: string }>).some(
        (n) => n.type === 'growth_achieved',
      ),
    ).toBe(true);
  });

  it('이벤트 목록/상세, 참가 자격 판정, 이벤트 토큰 발급이 동작한다', async () => {
    const user = await loginAs(`e2e-notif-${runId}-event-user`);

    const eligibleEvent = await prisma.event.create({
      data: {
        name: `e2e-event-${runId}-eligible`,
        type: 'festival',
        status: 'upcoming',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requiredGrowthLevel: null,
        requiredAttendanceCount: null,
        siteUrl: 'https://pium-events.com/e2e',
      },
    });
    const strictEvent = await prisma.event.create({
      data: {
        name: `e2e-event-${runId}-strict`,
        type: 'league',
        status: 'upcoming',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requiredGrowthLevel: 3,
        requiredAttendanceCount: 50,
        siteUrl: 'https://pium-events.com/e2e-strict',
      },
    });

    const list = await request(app.getHttpServer())
      .get('/v1/events')
      .query({ type: 'festival' })
      .expect(200);
    expect(
      (list.body.data.events as Array<{ id: string }>).some((e) => e.id === eligibleEvent.id),
    ).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/v1/events/${eligibleEvent.id}`)
      .expect(200);
    expect(detail.body.data.name).toBe(eligibleEvent.name);

    const notFound = await request(app.getHttpServer())
      .get('/v1/events/00000000-0000-0000-0000-000000000000')
      .expect(404);
    expect(notFound.body.error.code).toBe('EVENT_NOT_FOUND');

    const eligible = await request(app.getHttpServer())
      .get(`/v1/users/me/event-eligibility/${eligibleEvent.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(eligible.body.data.eligible).toBe(true);
    expect(eligible.body.data.reasons).toHaveLength(0);

    const ineligible = await request(app.getHttpServer())
      .get(`/v1/users/me/event-eligibility/${strictEvent.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(ineligible.body.data.eligible).toBe(false);
    expect(ineligible.body.data.reasons.length).toBeGreaterThan(0);

    const token = await request(app.getHttpServer())
      .get('/v1/users/me/event-token')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(token.body.data.event_token).toBeTruthy();
    expect(token.body.data.expires_in).toBe(300);
    expect(token.body.data.redirect_url).toContain(token.body.data.event_token);
  });
});
