import { Controller, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { OrdersService } from './orders.service';

/**
 * Stripe webhooks must receive the raw body for signature verification.
 * Nest is bootstrapped with `rawBody: true` in main.ts.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller(['api/v1/stripe', 'stripe'])
export class StripeWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing Stripe webhook payload or signature.');
    }
    const data = await this.ordersService.handleStripeWebhook(rawBody, signature);
    return { success: true, data };
  }
}
