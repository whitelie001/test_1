import { Module } from '@nestjs/common';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';
import { AnchorsModule } from '../anchors/anchors.module';
import { GrowthModule } from '../growth/growth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AnchorsModule, GrowthModule, NotificationsModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
})
export class CheckinsModule {}
