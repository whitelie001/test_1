/// 카카오 OAuth 액세스 토큰을 검증하고 프로필을 가져오는 인터페이스.
///
/// 실제 구현([HttpKakaoOAuthClient])은 카카오 개발자 앱이 있어야 종단간
/// 테스트가 가능하다(이 세션엔 없음). 개발/테스트용 [MockKakaoOAuthClient]는
/// 토큰 문자열을 그대로 카카오 사용자 ID로 취급해 실제 카카오 서버 없이도
/// 인증 흐름 전체(JWT 발급/갱신/로그아웃/탈퇴)를 검증할 수 있게 한다.
export interface KakaoUserProfile {
  kakaoId: string;
  nickname: string;
  profileImageUrl?: string;
}

export const KAKAO_OAUTH_CLIENT = 'KAKAO_OAUTH_CLIENT';

export interface KakaoOAuthClient {
  fetchProfile(kakaoAccessToken: string): Promise<KakaoUserProfile>;
}
