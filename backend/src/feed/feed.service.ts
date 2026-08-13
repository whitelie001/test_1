import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForbiddenApiException,
  MeetupNotFoundException,
} from '../common/exceptions/pium-api.exception';
import { OBJECT_STORAGE } from '../storage/object-storage.interface';
import type { ObjectStorage } from '../storage/object-storage.interface';
import { validateMediaSelection } from './domain/media-selection-validator';
import { isValidReactionEmoji } from './domain/reaction-emojis';
import { seoulYearMonthRange } from '../common/time/seoul-time';

interface UploadedMediaFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async getCalendar(meetupId: string, year: number, month: number) {
    const { start, end } = seoulYearMonthRange(year, month);
    const posts = await this.prisma.feedPost.findMany({
      where: { meetupId, deletedAt: null, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    });
    const feedDates = [
      ...new Set(posts.map((p) => p.createdAt.toISOString().slice(0, 10))),
    ].sort();

    // 문서 9.1절의 `events`(모임 일정)는 `schedule` JSON의 형태가 문서에
    // 정의돼 있지 않아(요일/시간 구조를 추측해 파싱하지 않음) 비워둔다.
    // 실제 활동 기록(feed_dates)만 정확히 계산해 반환한다.
    return { events: {}, feed_dates: feedDates };
  }

  async listFeed(meetupId: string, userId: string, date: string | undefined, page: number, limit = 20) {
    const meetup = await this.prisma.meetup.findUnique({ where: { id: meetupId } });
    if (!meetup) throw new MeetupNotFoundException();

    const where = {
      meetupId,
      deletedAt: null,
      ...(date
        ? {
            createdAt: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : {}),
    };

    const posts = await this.prisma.feedPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: true,
        media: { orderBy: { orderIndex: 'asc' } },
        reactions: true,
      },
    });

    return {
      posts: posts.map((post) => this.serializePost(post, userId)),
    };
  }

  async createPost(
    meetupId: string,
    userId: string,
    text: string | undefined,
    files: UploadedMediaFile[],
  ) {
    const membership = await this.prisma.meetupMember.findFirst({
      where: { meetupId, userId, leftAt: null },
    });
    if (!membership) throw new ForbiddenApiException();

    const validation = validateMediaSelection(files.map((f) => f.mimetype));
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const saved = await Promise.all(
      files.map((f) => this.storage.save(f.buffer, f.originalname, f.mimetype)),
    );

    const post = await this.prisma.feedPost.create({
      data: {
        meetupId,
        authorId: userId,
        content: text,
        media: {
          create: saved.map((s, index) => ({
            type: files[index].mimetype.startsWith('video/') ? 'video' : 'photo',
            storageKey: s.key,
            url: s.url,
            orderIndex: index,
          })),
        },
      },
    });

    return { post_id: post.id, created_at: post.createdAt };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.feedPost.findUnique({
      where: { id: postId },
      include: { meetup: true, media: true },
    });
    if (!post || post.deletedAt) throw new ForbiddenApiException();

    const isAuthor = post.authorId === userId;
    const isHost = post.meetup.hostId === userId;
    if (!isAuthor && !isHost) throw new ForbiddenApiException();

    await Promise.all(post.media.map((m) => this.storage.delete(m.storageKey)));
    await this.prisma.feedPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
  }

  async toggleReaction(postId: string, userId: string, emoji: string) {
    if (!isValidReactionEmoji(emoji)) {
      throw new BadRequestException('지원하지 않는 이모지입니다');
    }
    const post = await this.prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new ForbiddenApiException();

    const existing = await this.prisma.feedReaction.findFirst({
      where: { postId, userId, emoji },
    });

    if (existing) {
      await this.prisma.feedReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.feedReaction.create({ data: { postId, userId, emoji } });
    }

    const count = await this.prisma.feedReaction.count({ where: { postId, emoji } });
    return { emoji, count, my_reaction: !existing };
  }

  private serializePost(
    post: {
      id: string;
      content: string | null;
      createdAt: Date;
      author: { id: string; nickname: string; profileImageUrl: string | null };
      media: { type: string; url: string; orderIndex: number }[];
      reactions: { emoji: string; userId: string }[];
    },
    currentUserId: string,
  ) {
    const reactionCounts: Record<string, { count: number; my_reaction: boolean }> = {};
    for (const r of post.reactions) {
      reactionCounts[r.emoji] ??= { count: 0, my_reaction: false };
      reactionCounts[r.emoji].count++;
      if (r.userId === currentUserId) reactionCounts[r.emoji].my_reaction = true;
    }

    return {
      id: post.id,
      author: {
        id: post.author.id,
        nickname: post.author.nickname,
        profile_image: post.author.profileImageUrl,
      },
      media: post.media.map((m) => ({ type: m.type, url: m.url })),
      text: post.content,
      reactions: reactionCounts,
      created_at: post.createdAt,
    };
  }
}
