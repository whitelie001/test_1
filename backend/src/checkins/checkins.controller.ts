import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { CheckinsService } from './checkins.service';
import { CheckinEnterDto } from './dto/checkin-enter.dto';
import { CheckinLocationDto } from './dto/checkin-location.dto';
import { CheckinExitDto } from './dto/checkin-exit.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post('meetups/:id/checkin/enter')
  enter(
    @Param('id') meetupId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CheckinEnterDto,
  ) {
    return this.checkinsService.enter(meetupId, userId, dto);
  }

  @Put('checkins/:checkinId/location')
  updateLocation(
    @Param('checkinId') checkinId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CheckinLocationDto,
  ) {
    return this.checkinsService.updateLocation(checkinId, userId, dto);
  }

  @Post('checkins/:checkinId/exit')
  exit(
    @Param('checkinId') checkinId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CheckinExitDto,
  ) {
    return this.checkinsService.exit(checkinId, userId, dto);
  }

  @Get('checkins/:checkinId/status')
  getStatus(@Param('checkinId') checkinId: string, @CurrentUserId() userId: string) {
    return this.checkinsService.getStatus(checkinId, userId);
  }

  @Get('meetups/:id/attendance')
  getAttendance(
    @Param('id') meetupId: string,
    @CurrentUserId() userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.checkinsService.getAttendance(meetupId, userId, query);
  }
}
