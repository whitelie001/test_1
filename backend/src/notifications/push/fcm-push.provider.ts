import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PushProvider } from './push-provider.interface';

/// 실제 FCM 발송 구현. 이 세션엔 Firebase 프로젝트가 없어 종단간 테스트는
/// 불가 — `S3ObjectStorage`/`HttpKakaoOAuthClient`와 같은 패턴으로, 자격증명
/// (FIREBASE_SERVICE_ACCOUNT_JSON)이 준비되면 PUSH_PROVIDER=fcm로 전환한다.
@Injectable()
export class FcmPushProvider implements PushProvider {
  private readonly logger = new Logger(FcmPushProvider.name);

  constructor(private readonly config: ConfigService) {
    if (getApps().length === 0) {
      const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON', '');
      initializeApp({
        credential: serviceAccountJson ? cert(JSON.parse(serviceAccountJson)) : undefined,
      });
    }
  }

  async send(
    deviceTokens: string[],
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    if (deviceTokens.length === 0) return;

    const data = payload
      ? Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)]))
      : undefined;

    try {
      const response = await getMessaging().sendEachForMulticast({
        tokens: deviceTokens,
        notification: { title, body },
        data,
      });
      if (response.failureCount > 0) {
        this.logger.warn(`FCM 발송 일부 실패: ${response.failureCount}/${deviceTokens.length}`);
      }
    } catch (error) {
      this.logger.error('FCM 발송 실패', error instanceof Error ? error.stack : String(error));
    }
  }
}
