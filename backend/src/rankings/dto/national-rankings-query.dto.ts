import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class NationalRankingsQueryDto {
  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;
}
