import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getErrorMessage } from '../errors';

/** Paths bots probe constantly — keep out of PM2 error.log */
const NOISE_PATH =
  /^\/($|robots\.txt|favicon\.ico|ads\.txt|sitemap\.xml|\.env|\.git|wp-|wordpress|phpmyadmin|admin|login|cgi-bin|actuator|hudson|\.well-known|info\.php|config\.php|device\.rsp|mcp|sse|aaa\d|aab\d)/i;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : getErrorMessage(exception, 'Internal server error');

    const path = request.originalUrl || request.url || '';
    const summary = `HTTP ${status}: ${typeof message === 'string' ? message : JSON.stringify(message)} Path: ${path}`;

    // Expected client/auth noise — warn only, no stack dump into PM2 error.log
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn(summary);
    } else if (status === HttpStatus.NOT_FOUND) {
      if (NOISE_PATH.test(path.split('?')[0])) {
        this.logger.debug(summary);
      } else {
        this.logger.warn(summary);
      }
    } else if (status >= 500) {
      this.logger.error(
        summary,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(summary);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: typeof message === 'object' ? message : { message },
    });
  }
}
