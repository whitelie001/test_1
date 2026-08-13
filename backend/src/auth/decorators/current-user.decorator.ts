import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/// JwtAuthGuard 통과 후 request.user에 담긴 `{ userId }`에서 userId만 꺼낸다.
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.userId;
  },
);
