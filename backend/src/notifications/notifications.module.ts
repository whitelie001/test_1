import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PUSH_PROVIDER } from './push/push-provider.interface';
import { NoopPushProvider } from './push/noop-push.provider';
import { FcmPushProvider } from './push/fcm-push.provider';

/// PUSH_PROVIDER=noop(기본, 개발용) | fcm
const pushProviderFactory: Provider = {
  provide: PUSH_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const driver = config.get<string>('PUSH_PROVIDER', 'noop');
    return driver === 'fcm' ? new FcmPushProvider(config) : new NoopPushProvider();
  },
};

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, pushProviderFactory],
  exports: [NotificationsService],
})
export class NotificationsModule {}
