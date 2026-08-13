import { Module } from '@nestjs/common';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [GrowthModule],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
