import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createPiumValidationPipe } from '../src/common/pipes/pium-validation-pipe';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Feed (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();

  async function loginAs(kakaoToken: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    return { accessToken: res.body.data.access_token as string, userId: res.body.data.user.id as string };
  }

  async function createMeetup(accessToken: string, name: string) {
    const res = await request(app.getHttpServer())
      .post('/v1/meetups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sport: '러닝',
        max_members: 10,
        lat: 37.5665,
        lng: 126.978,
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
    app.useGlobalPipes(createPiumValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const testUserFilter = { kakaoId: { startsWith: `mock-e2e-feed-${runId}` } };
    await prisma.feedReaction.deleteMany({ where: { user: testUserFilter } });
    await prisma.feedMedia.deleteMany({ where: { post: { author: testUserFilter } } });
    await prisma.feedPost.deleteMany({ where: { author: testUserFilter } });
    await prisma.meetupMember.deleteMany({ where: { user: testUserFilter } });
    await prisma.meetup.deleteMany({ where: { host: testUserFilter } });
    await prisma.user.deleteMany({ where: testUserFilter });
    await app.close();
  });

  it('멤버는 텍스트 게시물을 올릴 수 있고, 목록/삭제/반응 토글이 정상 동작한다', async () => {
    const host = await loginAs(`e2e-feed-${runId}-host`);
    const meetupId = await createMeetup(host.accessToken, '피드 e2e 모임');

    const created = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/feed`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .field('text', '오늘 운동 완료!')
      .expect(201);
    const postId = created.body.data.post_id as string;

    const list = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/feed`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(list.body.data.posts).toHaveLength(1);
    expect(list.body.data.posts[0].text).toBe('오늘 운동 완료!');

    const reactOn = await request(app.getHttpServer())
      .post(`/v1/feed/${postId}/reactions`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ emoji: '🔥' })
      .expect(201);
    expect(reactOn.body.data).toEqual({ emoji: '🔥', count: 1, my_reaction: true });

    const reactOff = await request(app.getHttpServer())
      .post(`/v1/feed/${postId}/reactions`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ emoji: '🔥' })
      .expect(201);
    expect(reactOff.body.data).toEqual({ emoji: '🔥', count: 0, my_reaction: false });

    await request(app.getHttpServer())
      .post(`/v1/feed/${postId}/reactions`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ emoji: '😂' }) // 허용 목록에 없는 이모지
      .expect(400)
      .then((res) => expect(res.body.error.code).toBe('VALIDATION_ERROR'));

    await request(app.getHttpServer())
      .delete(`/v1/feed/${postId}`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);

    const afterDelete = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/feed`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
    expect(afterDelete.body.data.posts).toHaveLength(0);
  });

  it('비멤버는 게시물을 작성할 수 없고, 작성자/호스트가 아니면 삭제할 수 없다', async () => {
    const host = await loginAs(`e2e-feed-${runId}-perm-host`);
    const member = await loginAs(`e2e-feed-${runId}-perm-member`);
    const outsider = await loginAs(`e2e-feed-${runId}-perm-outsider`);
    const meetupId = await createMeetup(host.accessToken, '피드 권한 모임');

    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/join`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/feed`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .field('text', '난 멤버가 아닌데')
      .expect(403);

    const memberPost = await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/feed`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .field('text', '멤버가 쓴 글')
      .expect(201);
    const postId = memberPost.body.data.post_id as string;

    // 작성자도 호스트도 아닌 outsider는 삭제 못함(join 안 했으니 접근 자체는 불필요하지만
    // 삭제 권한 로직만 검증하기 위해 outsider로 시도)
    await request(app.getHttpServer())
      .delete(`/v1/feed/${postId}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);

    // 호스트는 작성자가 아니어도 삭제 가능
    await request(app.getHttpServer())
      .delete(`/v1/feed/${postId}`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .expect(200);
  });

  it('달력 조회는 실제 게시물이 있는 날짜만 feed_dates로 반환한다', async () => {
    const host = await loginAs(`e2e-feed-${runId}-calendar-host`);
    const meetupId = await createMeetup(host.accessToken, '달력 e2e 모임');

    await request(app.getHttpServer())
      .post(`/v1/meetups/${meetupId}/feed`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .field('text', '오늘 기록')
      .expect(201);

    const now = new Date();
    const calendar = await request(app.getHttpServer())
      .get(`/v1/meetups/${meetupId}/calendar`)
      .query({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 })
      .expect(200);

    expect(calendar.body.data.feed_dates.length).toBeGreaterThanOrEqual(1);
  });
});
