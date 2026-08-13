import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createPiumValidationPipe } from '../src/common/pipes/pium-validation-pipe';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import Redis from 'ioredis';

/// MockKakaoOAuthClient(KAKAO_OAUTH_MODE=mock, .env 기본값) 기준으로
/// 카카오 개발자 앱 없이 인증 흐름 전체를 검증한다.
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: Redis;

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
    redis = app.get(REDIS_CLIENT);
  });

  afterAll(async () => {
    await prisma.deviceToken.deleteMany({ where: { user: { kakaoId: { startsWith: 'mock-e2e-auth-' } } } });
    await prisma.user.deleteMany({ where: { kakaoId: { startsWith: 'mock-e2e-auth-' } } });
    await app.close();
  });

  const kakaoToken = `e2e-auth-${Date.now()}`;

  it('카카오 로그인으로 JWT 발급 + 신규 사용자 생성', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken, device_token: 'fcm-e2e' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.refresh_token).toBeDefined();
    expect(res.body.data.user.is_new).toBe(true);
  });

  it('refresh token으로 access token을 갱신하고, 이전 refresh token은 회전으로 폐기된다', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    const oldRefresh = login.body.data.refresh_token;

    const refreshed = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refresh_token: oldRefresh })
      .expect(201);
    expect(refreshed.body.data.access_token).toBeDefined();
    expect(refreshed.body.data.refresh_token).not.toBe(oldRefresh);

    const reused = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refresh_token: oldRefresh })
      .expect(401);
    expect(reused.body.error.code).toBe('UNAUTHORIZED');
  });

  it('유효하지 않은 access token으로 인증 필요 API 호출 시 401 UNAUTHORIZED', async () => {
    const res = await request(app.getHttpServer())
      .delete('/v1/auth/withdraw')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('탈퇴 후 동일 카카오 계정으로 재로그인하면 계정이 복구된다', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    const accessToken = login.body.data.access_token;

    await request(app.getHttpServer())
      .delete('/v1/auth/withdraw')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const user = await prisma.user.findUnique({
      where: { kakaoId: `mock-${kakaoToken}` },
    });
    expect(user?.withdrawnAt).not.toBeNull();

    const relogin = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken })
      .expect(201);
    expect(relogin.body.data.user.is_new).toBe(false);

    const revived = await prisma.user.findUnique({
      where: { kakaoId: `mock-${kakaoToken}` },
    });
    expect(revived?.withdrawnAt).toBeNull();
  });

  it('로그아웃하면 해당 refresh token은 더 이상 사용할 수 없다', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/kakao')
      .send({ kakao_token: kakaoToken });
    const refreshToken = login.body.data.refresh_token;

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .send({ refresh_token: refreshToken })
      .expect(200);

    const res = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
