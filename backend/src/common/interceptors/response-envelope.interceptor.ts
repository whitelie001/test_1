import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';
import { Paginated } from '../dto/paginated.dto';

/// 모든 성공 응답을 문서 2.2절의 `{ success, data, error, meta }` 포맷으로 감싼다.
@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result instanceof Paginated) {
          return {
            success: true,
            data: result.data,
            error: null,
            meta: result.meta,
          };
        }
        return {
          success: true,
          data: result ?? null,
          error: null,
        };
      }),
    );
  }
}
