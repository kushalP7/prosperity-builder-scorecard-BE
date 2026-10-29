import { IsIn, IsString } from 'class-validator';

export class MoveLandingPartnerDto {
  @IsString()
  @IsIn(['up', 'down'])
  direction: 'up' | 'down';
}
