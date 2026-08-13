import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { KAKAO_OAUTH_CLIENT } from './kakao-oauth-client.interface';
import { HttpKakaoOAuthClient } from './http-kakao-oauth.client';
import { MockKakaoOAuthClient } from './mock-kakao-oauth.client';

/// KAKAO_OAUTH_MODE=mock(기본, 카카오 앱 없이 개발) | kakao(실제 카카오 서버 검증)
export const kakaoOAuthClientProvider: Provider = {
  provide: KAKAO_OAUTH_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const mode = config.get<string>('KAKAO_OAUTH_MODE', 'mock');
    return mode === 'kakao'
      ? new HttpKakaoOAuthClient()
      : new MockKakaoOAuthClient();
  },
};
