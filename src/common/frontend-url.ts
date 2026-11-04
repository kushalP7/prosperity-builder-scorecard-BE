import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const LOCAL_DEFAULT = 'http://localhost:3000';
const logger = new Logger('FrontendUrl');

/**
 * Base URL for links in emails (set-password, login, etc.).
 * In non-production, never emit a remote host (e.g. Vercel) even if
 * FRONTEND_URL was copied from .env.prod — forces local FE instead.
 */
export function getFrontendBaseUrl(config: ConfigService): string {
  const raw = (config.get<string>('FRONTEND_URL') || LOCAL_DEFAULT).replace(/\/+$/, '');
  const isProd = (config.get<string>('NODE_ENV') || process.env.NODE_ENV) === 'production';

  if (isProd) return raw;

  try {
    const host = new URL(raw).hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (!isLocal) {
      logger.warn(
        `FRONTEND_URL=${raw} is not local while NODE_ENV≠production — using ${LOCAL_DEFAULT} for email links`,
      );
      return LOCAL_DEFAULT;
    }
  } catch {
    return LOCAL_DEFAULT;
  }

  return raw;
}
