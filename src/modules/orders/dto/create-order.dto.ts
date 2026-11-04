import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ enum: ['scorecard_only', 'subscription', 'combined'] })
  @IsIn(['scorecard_only', 'subscription', 'combined'])
  packageType: 'scorecard_only' | 'subscription' | 'combined';

  @ApiProperty({ description: 'Display name (email always taken from JWT)' })
  @IsString()
  @MinLength(2)
  customerName: string;

  /** Project name entered at checkout (stored as order.organization; seeds project name on mark-paid). */
  @ApiProperty({ required: false, description: 'Project name for the scorecard (optional)' })
  @IsOptional()
  @IsString()
  organization?: string;

  /** Optional; checkout is always invoice / mail check. */
  @ApiProperty({ enum: ['invoice'], required: false, default: 'invoice' })
  @IsOptional()
  @IsIn(['invoice'])
  checkoutMethod?: 'invoice';
}
