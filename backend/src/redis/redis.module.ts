import {
  Global,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/// ioredis 클라이언트를 Nest 생명주기에 맞춰 정리하는 래퍼.
/// (테스트 종료 시 연결이 남아 jest가 종료되지 않는 문제 방지)
@Injectable()
class RedisLifecycle implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  onModuleInit() {
    // 연결은 useFactory에서 이미 시작됨 — 별도 처리 없음
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        return new Redis(url);
      },
    },
    RedisLifecycle,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
