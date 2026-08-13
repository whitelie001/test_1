import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ObjectStorage, SavedObject } from './object-storage.interface';

/// 실제 AWS S3 구현(문서 2.1절). 이 세션엔 AWS 계정/버킷이 없어 종단간
/// 테스트는 불가 — PutObjectCommand 구성까지는 단위테스트 가능하지만
/// 실제 네트워크 호출은 검증되지 않았다. AWS_S3_BUCKET/AWS_REGION 등
/// 자격증명이 준비되면 STORAGE_DRIVER=s3로 전환한다.
@Injectable()
export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', '');
    this.client = new S3Client({ region: this.config.get<string>('AWS_REGION', 'ap-northeast-2') });
  }

  async save(buffer: Buffer, filename: string, mimetype: string): Promise<SavedObject> {
    const key = `feed/${randomUUID()}${extname(filename)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );
    return { key, url: `https://${this.bucket}.s3.amazonaws.com/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
