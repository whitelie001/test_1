import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListMeetupsQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  radius: number = 5000;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @IsIn(['새벽', '오전', '오후', '저녁', '주말'])
  time_slot?: string;

  @IsOptional()
  @IsIn(['초급', '중급', '고급', '전체'])
  level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  growth_level?: number;

  @IsOptional()
  @IsIn(['소모임', '대모임'])
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit: number = 20;
}
