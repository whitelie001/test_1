import { Controller, Get, Param } from '@nestjs/common';
import { GrowthService } from './growth.service';

@Controller('meetups')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get(':id/growth')
  getGrowth(@Param('id') meetupId: string) {
    return this.growthService.getGrowth(meetupId);
  }

  @Get(':id/growth/history')
  getGrowthHistory(@Param('id') meetupId: string) {
    return this.growthService.getGrowthHistory(meetupId);
  }
}
