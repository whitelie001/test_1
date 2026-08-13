import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OBJECT_STORAGE } from './object-storage.interface';
import { LocalDiskObjectStorage } from './local-disk-object-storage';
import { S3ObjectStorage } from './s3-object-storage';

/// STORAGE_DRIVER=local(기본) | s3
const objectStorageProvider: Provider = {
  provide: OBJECT_STORAGE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const driver = config.get<string>('STORAGE_DRIVER', 'local');
    return driver === 's3' ? new S3ObjectStorage(config) : new LocalDiskObjectStorage();
  },
};

@Module({
  imports: [ConfigModule],
  providers: [objectStorageProvider],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
