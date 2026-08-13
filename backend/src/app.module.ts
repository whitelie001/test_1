import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { MeetupsModule } from './meetups/meetups.module';
import { UsersModule } from './users/users.module';
import { AnchorsModule } from './anchors/anchors.module';
import { CheckinsModule } from './checkins/checkins.module';
import { GrowthModule } from './growth/growth.module';
import { RankingsModule } from './rankings/rankings.module';
import { FeedModule } from './feed/feed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // STORAGE_DRIVER=local(기본)일 때 storage-mock/의 업로드 파일을
    // /uploads/*로 서빙한다. S3로 전환하면 이 정적 서빙은 불필요해진다.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'storage-mock'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    MeetupsModule,
    UsersModule,
    AnchorsModule,
    CheckinsModule,
    GrowthModule,
    RankingsModule,
    FeedModule,
    NotificationsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
