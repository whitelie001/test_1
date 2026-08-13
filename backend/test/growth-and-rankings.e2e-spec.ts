import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Growth + Rankings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();

  async function loginAs(kakaoToken: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    return {
      accessToken: res.body.data.access_token as string,
      userId: res.body.data.user.id as string,
    };
  }

  async function createMeetup(accessToken: string, name: string, maxMembers = 5) {
    const res = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sport: `e2e-growth-sport-${runId}`,
        max_members: maxMembers,
        lat: 37.5665,
        lng: 126.978,
        location_name: '한강공원',
        schedule: { day: '월', time: '19:00' },
      });
    return res.body.data.id as string;
  }

  /// 실제로 여러 날에 걸쳐 체크인을 반복하는 대신, 과거 날짜의
  /// 세션+완료된 체크인을 직접 생성해 "N일 연속 출석"을 재현한다.
  async function seedPastCompletedSession(meetupId: string, userId: string, daysAgo: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    date.setUTCHours(0, 0, 0, 0);

    const session = await prisma.meetupSession.create({
      data: { meetupId, sessionDate: date, status: 'completed' },
    });
    await prisma.checkin.create({
      data: {
        id: randomUUID(),
        sessionId: session.id,
        userId,
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
    const testUserFilter = { kakaoId: { startsWith: `mock-e2e-growth-${runId}` } };
    await prisma.checkin.deleteMany({ where: { user: testUserFilter } });
    await prisma.growthHistory.deleteMany({ where: { meetup: { host: testUserFilter } } });
    await prisma.meetupSession.deleteMany({ where: { meetup: { host: testUserFilter } } });
    await prisma.meetupMember.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetup.deleteMany({ where: { host: testUserFilter } });
    await prisma.user.deleteMany({ where: testUserFilter });
    await app.close();
  });

  it('활동이 없으면 씨앗(0단계)이고, 5일 연속 출석하면 새싹(1단계)으로 승급하며 이력이 남는다', async () => {
    const host = await loginAs(`e2e-growth-${runId}-host`);
    const meetupId = await createMeetup(host.accessToken, '성장 e2e 모임');

    const initial = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/growth`)
      .expect(200);
    expect(initial.body.data.growth_level).toBe(0);
    expect(initial.body.data.growth_name).toBe('씨앗');

    for (let daysAgo = 5; daysAgo >= 1; daysAgo--) {
      await seedPastCompletedSession(meetupId, host.userId, daysAgo);
    }

    const grown = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/growth`)
      .expect(200);
    expect(grown.body.data.growth_level).toBe(1);
    expect(grown.body.data.growth_name).toBe('새싹');
    expect(grown.body.data.total_count).toBe(5);
    expect(grown.body.data.streak_count).toBe(5);
    expect(grown.body.data.next_level).toBe(2);

    const history = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/growth/history`)
      .expect(200);
    const levels = history.body.data.history.map((h: { level: number }) => h.level);
    expect(levels).toContain(0);
    expect(levels).toContain(1);
  });

  it('랭킹: 활동이 많은 모임이 더 높은 점수로 상위에 랭크되고, 종목 필터가 적용된다', async () => {
    const host = await loginAs(`e2e-growth-${runId}-rank-host`);
    const activeMeetupId = await createMeetup(host.accessToken, '활발한 모임');
    const quietMeetupId = await createMeetup(host.accessToken, '조용한 모임');

    for (let daysAgo = 3; daysAgo >= 1; daysAgo--) {
      await seedPastCompletedSession(activeMeetupId, host.userId, daysAgo);
    }

    const sportRankings = await request(app.getHttpServer())
      .get('/v1/rankings/sport')
      .query({ sport: `e2e-growth-sport-${runId}` })
      .expect(200);

    const names = sportRankings.body.data.rankings.map((r: { name: string }) => r.name);
    const activeIndex = names.indexOf('활발한 모임');
    const quietIndex = names.indexOf('조용한 모임');
    expect(activeIndex).toBeGreaterThanOrEqual(0);
    expect(quietIndex).toBeGreaterThan(activeIndex); // 활발한 모임이 더 높은 순위(작은 인덱스)

    const myMeetup = await request(app.getHttpServer())
      .get('/v1/rankings/my-meetup')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    const myNames = myMeetup.body.data.meetups.map((m: { name: string }) => m.name);
    expect(myNames).toContain('활발한 모임');
    expect(myNames).toContain('조용한 모임');
  });
});
