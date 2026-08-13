import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegionalRankingsQueryDto {
  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsString()
  sport?: string;
}
