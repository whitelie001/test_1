import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { MeetupsService } from '../meetups/meetups.service';
import { MyMeetupsQueryDto } from '../meetups/dto/pagination-query.dto';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StatsQueryDto } from './dto/stats-query.dto';

/// 문서 4장(사용자 API) + 5.3절(`GET /users/me/meetups`) + 7.3절
/// (`GET /users/me/pium-score`)를 모두 이 컨트롤러에 둔다.
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly meetupsService: MeetupsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getProfile(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put()
  updateProfile(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('meetups')
  listMyMeetups(
    @CurrentUserId() userId: string,
    @Query() query: MyMeetupsQueryDto,
  ) {
    return this.meetupsService.listMyMeetups(userId, query.role);
  }

  @Get('stats')
  getStats(@CurrentUserId() userId: string, @Query() query: StatsQueryDto) {
    return this.usersService.getStats(userId, query.year, query.month);
  }

  @Get('badges')
  getBadges(@CurrentUserId() userId: string) {
    return this.usersService.getBadges(userId);
  }

  @Get('pium-score')
  getPiumScore(@CurrentUserId() userId: string) {
    return this.usersService.getPiumScore(userId);
  }
}
