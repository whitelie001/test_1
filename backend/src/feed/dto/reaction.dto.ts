import { IsNotEmpty, IsString } from 'class-validator';

export class ReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji!: string;
}
