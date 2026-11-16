import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/** Bot / scanner probes — skip WARN spam in PM2 out.log */
const NOISE_PATH =
  /^\/($|robots\.txt|favicon\.ico|ads\.txt|sitemap\.xml|\.env|\.git|wp-|wordpress|phpmyadmin|admin|login|cgi-bin|actuator|hudson|\.well-known|info\.php|config\.php|device\.rsp|mcp|sse|aaa\d|aab\d)/i;

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
      const bare = (path || '').split('?')[0];

      if (res.statusCode >= 500) {
        this.logger.error(line);
      } else if (res.statusCode === 404 && NOISE_PATH.test(bare)) {
        // Scanner noise — debug only (hidden at default Nest log level)
        this.logger.debug(line);
      } else if (res.statusCode >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
