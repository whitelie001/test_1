import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import {
  KakaoOAuthClient,
  KakaoUserProfile,
} from './kakao-oauth-client.interface';

/// 실제 카카오 서버(`kapi.kakao.com`)에 토큰을 검증하는 구현.
/// 카카오 개발자 앱이 있어야 동작하며, 이 세션에서는 종단간 테스트 불가.
@Injectable()
export class HttpKakaoOAuthClient implements KakaoOAuthClient {
  async fetchProfile(kakaoAccessToken: string): Promise<KakaoUserProfile> {
    try {
      const { data } = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      });
      const account = data.kakao_account ?? {};
      const profile = account.profile ?? {};
      return {
        kakaoId: String(data.id),
        nickname: profile.nickname ?? '피움 유저',
        profileImageUrl: profile.profile_image_url,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 카카오 토큰입니다');
    }
  }
}
