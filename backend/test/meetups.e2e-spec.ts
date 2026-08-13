import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Meetups (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();

  const SEOUL = { lat: 37.5665, lng: 126.978 };
  const BUSAN = { lat: 35.1796, lng: 129.0756 };

  async function loginAs(kakaoToken: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    return {
      accessToken: res.body.data.access_token as string,
      userId: res.body.data.user.id as string,
    };
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
    const testUserFilter = { kakaoId: { startsWith: `mock-e2e-meetup-${runId}` } };
    await prisma.meetupMember.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetup.deleteMany({ where: { host: testUserFilter } });
    await prisma.user.deleteMany({ where: testUserFilter });
    await app.close();
  });

  it('모임 생성 시 인원 수로 소/대모임이 자동 분류된다', async () => {
    const host = await loginAs(`e2e-meetup-${runId}-host`);

    const small = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({
        name: '소모임 테스트',
        sport: '축구',
        max_members: 10,
        ...SEOUL,
        location_name: '한강공원',
        schedule: { day: '월', time: '19:00' },
      })
      .expect(201);
    expect(small.body.data.meetupType).toBe('small');

    const large = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({
        name: '대모임 테스트',
        sport: '러닝',
        max_members: 30,
        ...SEOUL,
        location_name: '한강공원',
        schedule: { day: '화', time: '20:00' },
      })
      .expect(201);
    expect(large.body.data.meetupType).toBe('large');
  });

  it('반경 필터: 서울 중심으로 조회하면 부산 모임은 나오지 않는다', async () => {
    const host = await loginAs(`e2e-meetup-${runId}-radius-host`);

    await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({
        name: '부산 모임',
        sport: '풋살',
        max_members: 10,
        ...BUSAN,
        location_name: '광안리',
        schedule: { day: '수', time: '19:00' },
      })
      .expect(201);

    const nearSeoul = await request(app.getHttpServer())
      .get('/v1/meetups')
      .query({ ...SEOUL, radius: 5000, sport: '풋살' });

    expect(
      nearSeoul.body.data.find((m: { name: string }) => m.name === '부산 모임'),
    ).toBeUndefined();

    const nearBusan = await request(app.getHttpServer())
      .get('/v1/meetups')
      .query({ ...BUSAN, radius: 5000, sport: '풋살' });
    expect(
      nearBusan.body.data.find((m: { name: string }) => m.name === '부산 모임'),
    ).toBeDefined();
    expect(nearBusan.body.meta.total).toBe(nearBusan.body.data.length);
  });

  it('가입 → 정원 초과 거부(MEETUP_FULL) → 탈퇴 → 역할변경(호스트만)', async () => {
    const host = await loginAs(`e2e-meetup-${runId}-join-host`);
    const memberA = await loginAs(`e2e-meetup-${runId}-join-a`);
    const memberB = await loginAs(`e2e-meetup-${runId}-join-b`);

    const created = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({
        name: '정원 테스트 모임',
        sport: '농구',
        max_members: 2, // 호스트 포함 2명이 정원
        ...SEOUL,
        location_name: '체육관',
        schedule: { day: '목', time: '19:00' },
      });
    const meetupId = created.body.data.id as string;

    const joinA = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/join`)
      .set('Authorization', `Bearer ${memberA.accessToken}`)
      .send({ message: '참여할게요' })
      .expect(201);
    expect(joinA.body.data.member_count).toBe(2);

    // 정원이 찼으므로 두 번째 멤버는 거부되어야 함
    const joinB = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/join`)
      .set('Authorization', `Bearer ${memberB.accessToken}`)
      .send({})
      .expect(409);
    expect(joinB.body.error.code).toBe('MEETUP_FULL');

    // 비호스트가 역할 변경 시도 → 거부
    await request(app.getHttpServer())
      .put(`/v1/meetups/${meetupId}/members/${memberA.userId}/role`)
      .set('Authorization', `Bearer ${memberA.accessToken}`)
      .send({ role: 'co_host' })
      .expect(403);

    // 호스트가 역할 변경 → 성공
    const roleChange = await request(app.getHttpServer())
      .put(`/v1/meetups/${meetupId}/members/${memberA.userId}/role`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ role: 'co_host' })
      .expect(200);
    expect(roleChange.body.data.role).toBe('co_host');

    // A가 탈퇴하면 정원에 여유가 생겨 B가 가입 가능해야 함
    await request(app.getHttpServer())
      .delete(`/v1/meetups/${meetupId}/leave`)
      .set('Authorization', `Bearer ${memberA.accessToken}`)
      .expect(200);

    const joinBRetry = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/join`)
      .set('Authorization', `Bearer ${memberB.accessToken}`)
      .send({})
      .expect(201);
    expect(joinBRetry.body.data.member_count).toBe(2);
  });

  it('GET /users/me/meetups는 내가 속한 모임만 반환한다', async () => {
    const host = await loginAs(`e2e-meetup-${runId}-mine-host`);
    const outsider = await loginAs(`e2e-meetup-${runId}-mine-outsider`);

    await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({
        name: '내 모임',
        sport: '배드민턴',
        max_members: 5,
        ...SEOUL,
        location_name: '체육관',
        schedule: { day: '금', time: '19:00' },
      })
      .expect(201);

    const mine = await request(app.getHttpServer())
      .get('/v1/users/me/meetups')
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(mine.body.data.some((m: { name: string }) => m.name === '내 모임')).toBe(true);

    const others = await request(app.getHttpServer())
      .get('/v1/users/me/meetups')
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(200);
    expect(others.body.data.some((m: { name: string }) => m.name === '내 모임')).toBe(false);
  });
});
