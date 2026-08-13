import { Module } from '@nestjs/common';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';
import { AnchorsModule } from '../anchors/anchors.module';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [AnchorsModule, GrowthModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
})
export class CheckinsModule {}
