import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateMeetupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  sport!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsPositive()
  max_members!: number;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsString()
  @IsNotEmpty()
  location_name!: string;

  @IsObject()
  schedule!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsInt()
  fee?: number;
}
