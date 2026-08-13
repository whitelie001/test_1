import { HttpException, HttpStatus } from '@nestjs/common';

/// 문서(피움 API 기획서 v1.0) 12장 에러 코드 카탈로그를 표현하는 기본 예외.
/// GlobalExceptionFilter가 이걸 `{ success:false, error:{code,message} }`로 변환한다.
export class PiumApiException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
  ) {
    super({ code, message }, status);
  }
}

export class InvalidLocationException extends PiumApiException {
  constructor() {
    super(
      'INVALID_LOCATION',
      '유효하지 않은 좌표입니다',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class OutOfRangeException extends PiumApiException {
  constructor() {
    super(
      'OUT_OF_RANGE',
      '모임 장소 반경 밖입니다',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InsufficientStayException extends PiumApiException {
  constructor() {
    super(
      'INSUFFICIENT_STAY',
      '체류 시간이 부족합니다',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CheckinAlreadyActiveException extends PiumApiException {
  constructor() {
    super(
      'CHECKIN_ALREADY_ACTIVE',
      '이미 진행 중인 체크인이 있습니다',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UnauthorizedApiException extends PiumApiException {
  constructor() {
    super('UNAUTHORIZED', '인증이 필요합니다', HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends PiumApiException {
  constructor() {
    super(
      'TOKEN_EXPIRED',
      '토큰이 만료됐습니다',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenApiException extends PiumApiException {
  constructor() {
    super('FORBIDDEN', '권한이 없습니다', HttpStatus.FORBIDDEN);
  }
}

export class NotMemberException extends PiumApiException {
  constructor() {
    super('NOT_MEMBER', '모임 멤버가 아닙니다', HttpStatus.FORBIDDEN);
  }
}

export class AnchorNotAuthorizedException extends PiumApiException {
  constructor() {
    super(
      'ANCHOR_NOT_AUTHORIZED',
      '앵커 모드 권한이 없습니다',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class MeetupNotFoundException extends PiumApiException {
  constructor() {
    super(
      'MEETUP_NOT_FOUND',
      '모임을 찾을 수 없습니다',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CheckinNotFoundException extends PiumApiException {
  constructor() {
    super(
      'CHECKIN_NOT_FOUND',
      '체크인 기록이 없습니다',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class MeetupFullException extends PiumApiException {
  constructor() {
    super(
      'MEETUP_FULL',
      '모임 정원이 가득 찼습니다',
      HttpStatus.CONFLICT,
    );
  }
}

export class AnchorTimeExceededException extends PiumApiException {
  constructor() {
    super(
      'ANCHOR_TIME_EXCEEDED',
      '앵커 활성화 가능 시간이 초과됐습니다',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
