import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Logs every HTTP request when the response finishes.
 * Visible in PM2 out/error logs: METHOD /path status durationMs
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    const { method } = req;
    const path = req.originalUrl || req.url;

    res.on('finish', () => {
      const ms = Date.now() - startedAt;
      const line = `${method} ${path} ${res.statusCode} ${ms}ms`;

      if (res.statusCode >= 500) {
        this.logger.error(line);
      } else if (res.statusCode >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
