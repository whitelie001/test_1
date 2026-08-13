import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { ReactionDto } from './dto/reaction.dto';

@Controller()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('meetups/:id/calendar')
  getCalendar(@Param('id') meetupId: string, @Query() query: CalendarQueryDto) {
    return this.feedService.getCalendar(meetupId, query.year, query.month);
  }

  @Get('meetups/:id/feed')
  @UseGuards(JwtAuthGuard)
  listFeed(
    @Param('id') meetupId: string,
    @Query() query: FeedQueryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.feedService.listFeed(meetupId, userId, query.date, query.page);
  }

  @Post('meetups/:id/feed')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('media', 10))
  createPost(
    @Param('id') meetupId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.feedService.createPost(
      meetupId,
      userId,
      dto.text,
      (files ?? []).map((f) => ({
        buffer: f.buffer,
        originalname: f.originalname,
        mimetype: f.mimetype,
      })),
    );
  }

  @Delete('feed/:postId')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('postId') postId: string, @CurrentUserId() userId: string) {
    await this.feedService.deletePost(postId, userId);
    return null;
  }

  @Post('feed/:postId/reactions')
  @UseGuards(JwtAuthGuard)
  toggleReaction(
    @Param('postId') postId: string,
    @CurrentUserId() userId: string,
    @Body() dto: ReactionDto,
  ) {
    return this.feedService.toggleReaction(postId, userId, dto.emoji);
  }
}
