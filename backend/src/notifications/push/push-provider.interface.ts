export const PUSH_PROVIDER = 'PUSH_PROVIDER';

/// 실제 푸시 발송을 추상화한다. [NoopPushProvider](기본값)는 아무것도 보내지
/// 않고, 알림은 앱 내 알림 목록(`notifications` 테이블)에만 쌓인다.
/// [FcmPushProvider]는 실제 FCM 호출까지 구현했지만 이 세션엔 Firebase
/// 프로젝트가 없어 종단간 테스트는 불가하다.
export interface PushProvider {
  send(
    deviceTokens: string[],
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ): Promise<void>;
}
