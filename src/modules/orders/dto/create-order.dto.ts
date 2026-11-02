import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ enum: ['scorecard_only', 'subscription', 'combined'] })
  @IsIn(['scorecard_only', 'subscription', 'combined'])
  packageType: 'scorecard_only' | 'subscription' | 'combined';

  @ApiProperty({ description: 'Display name (email always taken from JWT)' })
  @IsString()
  @MinLength(2)
  customerName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organization?: string;

  /** card = existing Stripe/stub checkout; invoice = pending + PDF invoice email */
  @ApiProperty({ enum: ['card', 'invoice'], required: false, default: 'card' })
  @IsOptional()
  @IsIn(['card', 'invoice'])
  checkoutMethod?: 'card' | 'invoice';
}
