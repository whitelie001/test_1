import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { RankingsService } from './rankings.service';
import { NationalRankingsQueryDto } from './dto/national-rankings-query.dto';
import { RegionalRankingsQueryDto } from './dto/regional-rankings-query.dto';
import { SportRankingsQueryDto } from './dto/sport-rankings-query.dto';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get('national')
  national(@Query() query: NationalRankingsQueryDto) {
    return this.rankingsService.national(query.sport, query.page);
  }

  @Get('regional')
  regional(@Query() query: RegionalRankingsQueryDto) {
    return this.rankingsService.regional(query.region, query.sport);
  }

  @Get('sport')
  sport(@Query() query: SportRankingsQueryDto) {
    return this.rankingsService.sport(query.sport, query.page);
  }

  @Get('my-meetup')
  @UseGuards(JwtAuthGuard)
  myMeetup(@CurrentUserId() userId: string) {
    return this.rankingsService.myMeetup(userId);
  }
}
