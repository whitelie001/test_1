import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedApiException } from '../common/exceptions/pium-api.exception';
import { RefreshTokenStore } from './refresh-token.store';
import { KAKAO_OAUTH_CLIENT } from './kakao/kakao-oauth-client.interface';
import type { KakaoOAuthClient } from './kakao/kakao-oauth-client.interface';
import { KakaoLoginDto } from './dto/kakao-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenStore,
    @Inject(KAKAO_OAUTH_CLIENT) private readonly kakaoClient: KakaoOAuthClient,
  ) {}

  async kakaoLogin(dto: KakaoLoginDto) {
    const profile = await this.kakaoClient.fetchProfile(dto.kakao_token);

    const existing = await this.prisma.user.findUnique({
      where: { kakaoId: profile.kakaoId },
    });

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { withdrawnAt: null }, // 탈퇴 후 재로그인 시 계정 부활
        })
      : await this.prisma.user.create({
          data: {
            kakaoId: profile.kakaoId,
            nickname: profile.nickname,
            profileImageUrl: profile.profileImageUrl,
          },
        });

    if (dto.device_token) {
      await this.prisma.deviceToken.upsert({
        where: {
          userId_token: { userId: user.id, token: dto.device_token },
        },
        create: {
          userId: user.id,
          token: dto.device_token,
          platform: 'unknown',
        },
        update: { lastSeenAt: new Date() },
      });
    }

    const accessToken = this.issueAccessToken(user.id);
    const refreshToken = await this.refreshTokens.issue(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        is_new: !existing,
      },
    };
  }

  async refresh(refreshToken: string) {
    const rotated = await this.refreshTokens.validateAndRotate(refreshToken);
    if (!rotated) {
      throw new UnauthorizedApiException();
    }
    return {
      access_token: this.issueAccessToken(rotated.userId),
      refresh_token: rotated.newTokenId,
      expires_in: this.accessTokenExpiresInSeconds(),
    };
  }

  async logout(refreshToken: string) {
    await this.refreshTokens.revoke(refreshToken);
  }

  async withdraw(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { withdrawnAt: new Date() },
    });
    await this.refreshTokens.revokeAllForUser(userId);
  }

  private issueAccessToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  private accessTokenExpiresInSeconds(): number {
    const raw = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '1h');
    const match = /^(\d+)h$/.exec(raw);
    return match ? Number(match[1]) * 3600 : 3600;
  }
}
