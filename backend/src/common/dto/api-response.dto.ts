/// 문서(피움 API 기획서 v1.0) 2.2절의 공통 응답 래퍼.
export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  nextCursor?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
  meta?: ApiMeta;
}
