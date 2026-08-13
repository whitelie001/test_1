/// 문서 9.2절: 활동 게시물은 "사진(최대 10장) 또는 영상(최대 60초) 1개".
/// 영상 길이(60초) 자체는 서버에서 별도 미디어 분석(ffprobe 등) 없이는
/// 검증할 수 없어 이 세션에서는 개수/형식만 검사한다 — 길이 제한은 클라이언트
/// 단에서 촬영/선택 시 강제하는 것을 전제로 한다.
export interface MediaValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateMediaSelection(mimetypes: string[]): MediaValidationResult {
  if (mimetypes.length === 0) return { valid: true };

  const videoCount = mimetypes.filter((m) => m.startsWith('video/')).length;
  const photoCount = mimetypes.filter((m) => m.startsWith('image/')).length;

  if (videoCount > 0 && photoCount > 0) {
    return { valid: false, reason: '사진과 영상을 함께 업로드할 수 없습니다' };
  }
  if (videoCount > 1) {
    return { valid: false, reason: '영상은 1개만 업로드할 수 있습니다' };
  }
  if (photoCount > 10) {
    return { valid: false, reason: '사진은 최대 10장까지 업로드할 수 있습니다' };
  }
  if (videoCount === 0 && photoCount === 0) {
    return { valid: false, reason: '지원하지 않는 파일 형식입니다' };
  }
  return { valid: true };
}
