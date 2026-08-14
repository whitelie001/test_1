import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createPiumValidationPipe } from '../src/common/pipes/pium-validation-pipe';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users profile/stats/badges/pium-score (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();

  const MEETUP_LAT = 37.5665;
  const MEETUP_LNG = 126.978;

  async function loginAs(kakaoToken: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    return {
      accessToken: res.body.data.access_token as string,
      userId: res.body.data.user.id as string,
    };
  }

  async function createMeetup(accessToken: string, name: string, sport: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sport,
        max_members: 10,
        lat: MEETUP_LAT,
        lng: MEETUP_LNG,
        location_name: '한강공원',
        schedule: { day: '월', time: '19:00' },
      });
    return res.body.data.id as string;
  }

  async function seedCompletedCheckin(
    meetupId: string,
    userId: string,
    daysAgo: number,
    score: number,
  ) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    date.setUTCHours(0, 0, 0, 0); // 자정(UTC) 근처 — KST 경계와 무관하게 같은 날짜로 계산되도록 낮 시간대를 피한다
    const session = await prisma.meetupSession.upsert({
      where: { meetupId_sessionDate: { meetupId, sessionDate: date } },
      create: { meetupId, sessionDate: date, status: 'completed' },
      update: {},
    });
    await prisma.checkin.create({
      data: {
        sessionId: session.id,
        userId,
        status: 'completed',
        enteredAt: date,
        exitedAt: date,
        isInRange: false,
        elapsedSeconds: 3900,
        rangeStateChangedAt: date,
        date,
        piumScoreEarned: score,
      },
    });
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
    const testUserFilter = { kakaoId: { startsWith: `mock-e2e-profile-${runId}` } };
    await prisma.checkin.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetupSession.deleteMany({ where: { meetup: { host: testUserFilter } } });
    await prisma.meetupMember.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetup.deleteMany({ where: { host: testUserFilter } });
    await prisma.user.deleteMany({ where: testUserFilter });
    await app.close();
  });

  it('PUT /users/me로 프로필을 수정하면 GET /users/me에 반영된다', async () => {
    const user = await loginAs(`e2e-profile-${runId}-basic`);

    const updated = await request(app.getHttpServer())
      .put('/v1/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ nickname: '변경된닉네임', sports: ['러닝', '풋살'] })
      .expect(200);
    expect(updated.body.data.nickname).toBe('변경된닉네임');
    expect(updated.body.data.favorite_sports).toEqual(['러닝', '풋살']);

    const profile = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(profile.body.data.nickname).toBe('변경된닉네임');
    expect(profile.body.data.favorite_sports).toEqual(['러닝', '풋살']);
    expect(profile.body.data.badges).toEqual([]);
    expect(profile.body.data.pium_score.total_score).toBe(0);
    expect(profile.body.data.activity_summary.total_checkins).toBe(0);
  });

  it('완료된 체크인 누적에 따라 pium-score/stats가 계산된다', async () => {
    const host = await loginAs(`e2e-profile-${runId}-score`);
    const meetupId = await createMeetup(host.accessToken, '점수 테스트 모임', '러닝');

    await seedCompletedCheckin(meetupId, host.userId, 1, 5);
    await seedCompletedCheckin(meetupId, host.userId, 0, 8);

    const score = await request(app.getHttpServer())
      .get('/v1/users/me/pium-score')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(score.body.data.breakdown.attendance).toBe(13);
    expect(score.body.data.total_score).toBeGreaterThanOrEqual(13);
    expect(score.body.data.breakdown.events).toBe(0);

    const stats = await request(app.getHttpServer())
      .get('/v1/users/me/stats')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(stats.body.data.heatmap.length).toBeGreaterThanOrEqual(1);
    expect(stats.body.data.sport_ratio['러닝']).toBe(100);

    const badges = await request(app.getHttpServer())
      .get('/v1/users/me/badges')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(badges.body.data.badges).toEqual([]);
  });
});
