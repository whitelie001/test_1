import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PiumApiException } from '../exceptions/pium-api.exception';

/// 모든 예외를 문서 2.2절/12장 포맷(`{success:false, data:null, error:{code,message}}`)으로 변환한다.
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof PiumApiException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as { code: string; message: string };
      response.status(status).json({
        success: false,
        data: null,
        error: { code: body.code, message: body.message },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message = this.extractMessage(raw, exception.message);
      response.status(status).json({
        success: false,
        data: null,
        error: { code: this.codeForStatus(status), message },
      });
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }

  private extractMessage(raw: unknown, fallback: string): string {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && 'message' in raw) {
      const m = (raw as { message: unknown }).message;
      return Array.isArray(m) ? m.join(', ') : String(m);
    }
    return fallback;
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'INVALID_LOCATION';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'MEETUP_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'MEETUP_FULL';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'ANCHOR_TIME_EXCEEDED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
