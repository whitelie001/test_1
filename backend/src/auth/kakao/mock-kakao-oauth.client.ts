import { Injectable } from '@nestjs/common';
import {
  KakaoOAuthClient,
  KakaoUserProfile,
} from './kakao-oauth-client.interface';

/// 카카오 개발자 앱 없이 인증 흐름을 개발/테스트하기 위한 목 구현.
/// 토큰 문자열을 그대로 카카오 사용자 ID로 취급한다(동일 토큰 = 동일 사용자).
@Injectable()
export class MockKakaoOAuthClient implements KakaoOAuthClient {
  fetchProfile(kakaoAccessToken: string): Promise<KakaoUserProfile> {
    return Promise.resolve({
      kakaoId: `mock-${kakaoAccessToken}`,
      nickname: `테스트유저-${kakaoAccessToken.slice(0, 6)}`,
    });
  }
}
