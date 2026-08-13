import { Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: NotificationsQueryDto) {
    return this.notificationsService.list(userId, query.is_read, query.page);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Put('read-all')
  markAllRead(@CurrentUserId() userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
}
