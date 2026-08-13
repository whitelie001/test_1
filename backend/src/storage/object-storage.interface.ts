export interface SavedObject {
  key: string;
  url: string;
}

export const OBJECT_STORAGE = 'OBJECT_STORAGE';

/// 사진/영상 저장을 추상화한다. 운영에서는 S3([S3ObjectStorage] — 이
/// 세션엔 AWS 계정이 없어 구현체만 있고 실제 호출은 검증 불가), 로컬
/// 개발에서는 [LocalDiskObjectStorage]를 쓴다.
export interface ObjectStorage {
  save(buffer: Buffer, filename: string, mimetype: string): Promise<SavedObject>;
  delete(key: string): Promise<void>;
}
