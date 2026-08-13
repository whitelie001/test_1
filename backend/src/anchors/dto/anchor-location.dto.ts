import { IsLatitude, IsLongitude } from 'class-validator';

export class AnchorLocationDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;
}
