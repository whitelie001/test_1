import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { MeetupsService } from './meetups.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { UpdateMeetupDto } from './dto/update-meetup.dto';
import { ListMeetupsQueryDto } from './dto/list-meetups-query.dto';
import { JoinMeetupDto } from './dto/join-meetup.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('meetups')
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  @Get()
  list(@Query() query: ListMeetupsQueryDto) {
    return this.meetupsService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.meetupsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreateMeetupDto) {
    return this.meetupsService.create(userId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateMeetupDto,
  ) {
    return this.meetupsService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    await this.meetupsService.remove(id, userId);
    return null;
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: JoinMeetupDto,
  ) {
    return this.meetupsService.join(id, userId, dto);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leave(@Param('id') id: string, @CurrentUserId() userId: string) {
    await this.meetupsService.leave(id, userId);
    return null;
  }

  @Get(':id/members')
  listMembers(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.meetupsService.listMembers(id, query.page);
  }

  @Put(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUserId() actingUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.meetupsService.updateMemberRole(
      id,
      actingUserId,
      targetUserId,
      dto.role,
    );
  }
}
