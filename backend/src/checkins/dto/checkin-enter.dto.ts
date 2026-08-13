import { IsBoolean, IsLatitude, IsLongitude, IsOptional } from 'class-validator';

export class CheckinEnterDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsBoolean()
  anchor_mode?: boolean;
}
