import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class StubPayDto {
  @ApiProperty({ example: '4242424242424242', description: 'Use 4000000000000002 to force decline' })
  @IsString()
  @Matches(/^\d{13,19}$/, { message: 'Card number must be 13–19 digits' })
  cardNumber: string;

  @ApiProperty({ example: '12/28' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Expiry must be MM/YY' })
  expiry: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @Length(3, 4)
  cvc: string;

  @ApiProperty({ required: false, description: 'Force a failed payment for testing' })
  @IsOptional()
  @IsBoolean()
  forceFail?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cardholderName?: string;
}
