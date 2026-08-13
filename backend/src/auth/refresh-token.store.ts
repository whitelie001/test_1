import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

/// Refresh token을 Redis에 보관한다. 토큰 값 자체가 아니라 opaque한
/// 랜덤 ID를 클라이언트에 발급하고, `refresh:{tokenId}` → userId로 매핑한다.
/// 로그아웃/탈퇴 시 즉시 폐기할 수 있고, 매 갱신마다 회전(rotate)시켜
/// 탈취된 토큰의 재사용 창을 좁힌다.
@Injectable()
export class RefreshTokenStore {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {
    const days = Number(this.config.get('JWT_REFRESH_EXPIRES_IN_DAYS', '30'));
    this.ttlSeconds = days * 24 * 60 * 60;
  }

  private tokenKey(tokenId: string) {
    return `refresh:${tokenId}`;
  }

  private userSetKey(userId: string) {
    return `refresh:user:${userId}`;
  }

  async issue(userId: string): Promise<string> {
    const tokenId = randomUUID();
    await this.redis
      .multi()
      .set(this.tokenKey(tokenId), userId, 'EX', this.ttlSeconds)
      .sadd(this.userSetKey(userId), tokenId)
      .expire(this.userSetKey(userId), this.ttlSeconds)
      .exec();
    return tokenId;
  }

  /// 토큰을 검증하고, 유효하면 이전 토큰을 폐기한 뒤 새 토큰을 발급한다(회전).
  /// 유효하지 않으면 null.
  async validateAndRotate(
    tokenId: string,
  ): Promise<{ userId: string; newTokenId: string } | null> {
    const userId = await this.redis.get(this.tokenKey(tokenId));
    if (!userId) return null;

    await this.revoke(tokenId, userId);
    const newTokenId = await this.issue(userId);
    return { userId, newTokenId };
  }

  async revoke(tokenId: string, userId?: string): Promise<void> {
    const resolvedUserId = userId ?? (await this.redis.get(this.tokenKey(tokenId)));
    const pipeline = this.redis.multi().del(this.tokenKey(tokenId));
    if (resolvedUserId) {
      pipeline.srem(this.userSetKey(resolvedUserId), tokenId);
    }
    await pipeline.exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const tokenIds = await this.redis.smembers(this.userSetKey(userId));
    if (tokenIds.length === 0) return;
    const pipeline = this.redis.multi();
    for (const tokenId of tokenIds) {
      pipeline.del(this.tokenKey(tokenId));
    }
    pipeline.del(this.userSetKey(userId));
    await pipeline.exec();
  }
}
