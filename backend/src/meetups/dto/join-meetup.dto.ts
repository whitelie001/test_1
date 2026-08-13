import { IsOptional, IsString } from 'class-validator';

export class JoinMeetupDto {
  @IsOptional()
  @IsString()
  message?: string;
}
