import { IsLatitude, IsLongitude } from 'class-validator';

export class CheckinExitDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;
}
