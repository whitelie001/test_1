import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ObjectStorage, SavedObject } from './object-storage.interface';

const STORAGE_DIR = join(process.cwd(), 'storage-mock');

/// 로컬 디스크에 저장하는 기본 구현. `backend/storage-mock/`(gitignore됨)에
/// 쓰고, `/uploads/{key}`로 정적 서빙한다(main.ts의 ServeStaticModule 참고).
@Injectable()
export class LocalDiskObjectStorage implements ObjectStorage {
  async save(buffer: Buffer, filename: string, _mimetype: string): Promise<SavedObject> {
    await mkdir(STORAGE_DIR, { recursive: true });
    const key = `${randomUUID()}${extname(filename)}`;
    await writeFile(join(STORAGE_DIR, key), buffer);
    return { key, url: `/uploads/${key}` };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(STORAGE_DIR, key));
    } catch {
      // 이미 없으면 무시
    }
  }
}
