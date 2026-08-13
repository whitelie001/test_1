import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Checkins + Anchors (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();

  const MEETUP_LAT = 37.5665;
  const MEETUP_LNG = 126.978;
  const FAR_AWAY = { lat: 37.576, lng: 126.978 }; // 약 1km 이상 떨어짐
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

  async function createMeetup(accessToken: string, name: string, maxMembers = 10) {
    const res = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sport: '러닝',
        max_members: maxMembers,
        lat: MEETUP_LAT,
        lng: MEETUP_LNG,
        location_name: '한강공원',
        schedule: { day: '월', time: '19:00' },
      });
    return res.body.data.id as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const testUserFilter = { kakaoId: { startsWith: `mock-e2e-checkin-${runId}` } };
    await prisma.checkin.deleteMany({ where: { user: testUserFilter } });
    await prisma.anchor.deleteMany({ where: { activator: testUserFilter } });
    await prisma.meetupSession.deleteMany({ where: { meetup: { host: testUserFilter } } });
    await prisma.meetupMember.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetup.deleteMany({ where: { host: testUserFilter } });
    await prisma.user.deleteMany({ where: testUserFilter });
    await app.close();
  });

  it('반경 밖 입장은 OUT_OF_RANGE, 비멤버 입장은 NOT_MEMBER로 거부된다', async () => {
    const host = await loginAs(`e2e-checkin-${runId}-range-host`);
    const outsider = await loginAs(`e2e-checkin-${runId}-range-outsider`);
    const meetupId = await createMeetup(host.accessToken, '반경 테스트 모임');

    const outOfRange = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/checkin/enter`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send(FAR_AWAY)
      .expect(400);
    expect(outOfRange.body.error.code).toBe('OUT_OF_RANGE');

    const notMember = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/checkin/enter`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send(INSIDE_100M)
      .expect(403);
    expect(notMember.body.error.code).toBe('NOT_MEMBER');
  });

  it('입장 → 중복입장거부 → 반경이탈시정지 → 조기퇴장거부 → 1시간후퇴장성공', async () => {
    const host = await loginAs(`e2e-checkin-${runId}-flow-host`);
    const meetupId = await createMeetup(host.accessToken, '체크인 플로우 모임');

    const enter = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/checkin/enter`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send(INSIDE_100M)
      .expect(201);
    const checkinId = enter.body.data.checkin_id as string;
    expect(enter.body.data.status).toBe('entered');

    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/checkin/enter`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send(INSIDE_100M)
      .expect(400)
      .then((res) => expect(res.body.error.code).toBe('CHECKIN_ALREADY_ACTIVE'));

    // 반경 밖으로 이동 → 즉시 정지(유예 없음)
    const outPing = await request(app.getHttpServer())
      .put(`/v1/checkins/${checkinId}/location`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send(FAR_AWAY)
      .expect(200);
    expect(outPing.body.data.is_in_range).toBe(false);
    expect(outPing.body.data.elapsed_seconds).toBe(0);

    await request(app.getHttpServer())
      .post(`/v1/checkins/${checkinId}/exit`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send(INSIDE_100M)
      .expect(400)
      .then((res) => expect(res.body.error.code).toBe('INSUFFICIENT_STAY'));

    // 서버 기록 기준 타이머 복원을 검증하기 위해, 실제 1시간을 기다리는 대신
    // range_state_changed_at을 과거로 되돌려 "70분째 반경 안에 머무는 중" 상태를 재현한다.
    await prisma.checkin.update({
      where: { id: checkinId },
      data: {
        isInRange: true,
        rangeStateChangedAt: new Date(Date.now() - 70 * 60 * 1000),
        outOfRangeSince: null,
      },
    });

    const status = await request(app.getHttpServer())
      .get(`/v1/checkins/${checkinId}/status`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(status.body.data.elapsed_seconds).toBeGreaterThanOrEqual(4200 - 5);

    const exit = await request(app.getHttpServer())
      .post(`/v1/checkins/${checkinId}/exit`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send(INSIDE_100M)
      .expect(201);
    expect(exit.body.data.status).toBe('completed');
    expect(exit.body.data.attendance_confirmed).toBe(true);
    expect(exit.body.data.total_seconds).toBeGreaterThanOrEqual(4200);
    expect(exit.body.data.pium_score_earned).toBeGreaterThan(0);

    const attendance = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/attendance`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(attendance.body.data.records).toHaveLength(1);
    expect(attendance.body.data.records[0].attended).toBe(true);
  });

  it('팀장 앵커 모드: 권한 없는 멤버는 거부, 호스트가 활성화하면 멤버가 앵커 위치 기준으로 체크인할 수 있다', async () => {
    const host = await loginAs(`e2e-checkin-${runId}-anchor-host`);
    const member = await loginAs(`e2e-checkin-${runId}-anchor-member`);
    const meetupId = await createMeetup(host.accessToken, '앵커 테스트 모임');

    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/join`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({})
      .expect(201);

    // 일반 멤버는 앵커를 활성화할 수 없다.
    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/anchor/activate`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ lat: 37.6, lng: 127.0 })
      .expect(403)
      .then((res) => expect(res.body.error.code).toBe('ANCHOR_NOT_AUTHORIZED'));

    // 호스트는 모임 고정 위치와 전혀 다른 실내 체육관 좌표로 앵커를 켠다.
    const activate = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/anchor/activate`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ lat: 37.6, lng: 127.0 })
      .expect(201);
    const anchorId = activate.body.data.anchor_id as string;
    expect(activate.body.data.expires_at).toBeDefined();

    // 모임 고정 위치 기준으로는 반경 밖이지만, 앵커(팀장) 위치 기준으로는 반경 안.
    const enter = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/checkin/enter`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ lat: 37.6001, lng: 127.0001, anchor_mode: true })
      .expect(201);
    const checkinId = enter.body.data.checkin_id as string;

    // 팀장이 이동하면(위치 업데이트) 멤버 판정 기준도 함께 이동한다.
    await request(app.getHttpServer())
      .put(`/v1/anchors/${anchorId}/location`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ lat: 37.601, lng: 127.001 })
      .expect(200);

    const ping = await request(app.getHttpServer())
      .put(`/v1/checkins/${checkinId}/location`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ lat: 37.6011, lng: 127.0011, is_anchor: true })
      .expect(200);
    expect(ping.body.data.is_in_range).toBe(true);

    // 앵커 반경(30m) 밖으로 나가면 30초 유예 안에는 계속 in_range=true.
    const graceStillOk = await request(app.getHttpServer())
      .put(`/v1/checkins/${checkinId}/location`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ lat: 37.602, lng: 127.003, is_anchor: true })
      .expect(200);
    expect(graceStillOk.body.data.is_in_range).toBe(true);
  });
});
