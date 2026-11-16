import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Public liveness endpoints so scanners / load balancers hitting `/` get 200
 * instead of flooding PM2 error logs with 404s.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller()
export class HealthController {
  @Public()
  @Get()
  root() {
    return { ok: true, service: 'prosperity-builder-scorecard-api' };
  }

  @Public()
  @Get(['health', 'api/v1/health'])
  health() {
    return { ok: true, status: 'up', ts: new Date().toISOString() };
  }
}
