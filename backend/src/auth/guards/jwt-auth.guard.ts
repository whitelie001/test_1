import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  TokenExpiredException,
  UnauthorizedApiException,
} from '../../common/exceptions/pium-api.exception';

/// 문서 12장 에러 코드 구분(401 UNAUTHORIZED vs 401 TOKEN_EXPIRED)을 반영한
/// JWT 인증 가드.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: { name?: string } | undefined,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }
      throw new UnauthorizedApiException();
    }
    return user;
  }
}
