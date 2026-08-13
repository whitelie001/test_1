import { IsOptional, IsString } from 'class-validator';

export class KakaoLoginDto {
  @IsString()
  kakao_token!: string;

  @IsOptional()
  @IsString()
  device_token?: string;
}
