import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DataItemDto {
  value: any;
  source?: string;
  notes?: string;
  scoreValue?: number;
}

export class DataUpdateItemDto {
  @ApiProperty({ example: 'group_node_id' })
  @IsString()
  nodeId: string;

  @ApiProperty({ example: '__base__' })
  @IsString()
  columnId: string;

  @ApiProperty()
  @IsObject()
  data: DataItemDto;
}

export class UpdateProjectDataDto {
  @ApiProperty({ type: [DataUpdateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataUpdateItemDto)
  updates: DataUpdateItemDto[];
}
