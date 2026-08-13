import { Injectable, Logger } from '@nestjs/common';
import { PushProvider } from './push-provider.interface';

/// 개발 기본값. 실제로 보내지 않고 로그만 남긴다 — 알림은 여전히
/// `notifications` 테이블에 쌓이므로 앱 내 알림 목록 기능은 그대로 동작한다.
@Injectable()
export class NoopPushProvider implements PushProvider {
  private readonly logger = new Logger(NoopPushProvider.name);

  async send(deviceTokens: string[], title: string, body: string): Promise<void> {
    this.logger.debug(`(noop push) ${deviceTokens.length}개 기기로 "${title}: ${body}" 발송 생략`);
  }
}
