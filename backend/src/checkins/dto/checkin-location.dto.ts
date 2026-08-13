import { IsBoolean, IsLatitude, IsLongitude, IsOptional } from 'class-validator';

export class CheckinLocationDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsBoolean()
  is_anchor?: boolean;
}
