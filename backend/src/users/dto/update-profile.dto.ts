import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;

  @IsOptional()
  @IsUrl()
  profile_image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sports?: string[];
}
