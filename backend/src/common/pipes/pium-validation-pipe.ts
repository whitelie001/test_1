import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { InvalidLocationException } from '../exceptions/pium-api.exception';

const LOCATION_FIELDS = new Set(['lat', 'lng', 'targetLat', 'targetLng']);

/// 문서 12장은 좌표 검증 실패를 400 INVALID_LOCATION으로 명시한다.
/// class-validator의 @IsLatitude/@IsLongitude 실패는 기본적으로 그냥
/// BadRequestException이 되므로, 실패한 필드가 위경도 필드일 때만
/// InvalidLocationException으로 승격시키고 나머지는 일반 검증 오류로 둔다.
function hasLocationFieldError(errors: ValidationError[]): boolean {
  return errors.some((e) => LOCATION_FIELDS.has(e.property));
}

export function createPiumValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => {
      if (hasLocationFieldError(errors)) {
        return new InvalidLocationException();
      }
      const messages = errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join(', ');
      return new BadRequestException(messages || '유효하지 않은 요청입니다');
    },
  });
}
