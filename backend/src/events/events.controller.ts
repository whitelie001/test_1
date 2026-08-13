import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { EventsService } from './events.service';
import { EventsQueryDto } from './dto/events-query.dto';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('events')
  list(@Query() query: EventsQueryDto) {
    return this.eventsService.list(query.type, query.status);
  }

  @Get('events/:id')
  getById(@Param('id') id: string) {
    return this.eventsService.getById(id);
  }

  @Get('users/me/event-eligibility/:eventId')
  @UseGuards(JwtAuthGuard)
  getEligibility(@Param('eventId') eventId: string, @CurrentUserId() userId: string) {
    return this.eventsService.getEligibility(userId, eventId);
  }

  @Get('users/me/event-token')
  @UseGuards(JwtAuthGuard)
  getEventToken(@CurrentUserId() userId: string) {
    return this.eventsService.issueEventToken(userId);
  }
}
