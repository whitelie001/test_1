import { ApiMeta } from './api-response.dto';

/// 컨트롤러가 meta(페이지네이션 등)를 함께 반환해야 할 때 사용하는 래퍼.
/// ResponseEnvelopeInterceptor가 이 클래스의 인스턴스를 감지해 data/meta를 분리한다.
export class Paginated<T> {
  constructor(
    public readonly data: T,
    public readonly meta: ApiMeta,
  ) {}
}
