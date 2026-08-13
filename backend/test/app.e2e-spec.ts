import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createPiumValidationPipe } from '../src/common/pipes/pium-validation-pipe';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(createPiumValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });

  it('/v1/health (GET) 은 공통 응답 래퍼로 감싸진 상태를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect({ success: true, data: { status: 'ok' }, error: null });
  });

  afterEach(async () => {
    await app.close();
  });
});
