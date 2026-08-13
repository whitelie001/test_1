import { IsIn, IsOptional } from 'class-validator';

export class EventsQueryDto {
  @IsOptional()
  @IsIn(['league', 'festival', 'sponsor'])
  type?: string;

  @IsOptional()
  @IsIn(['upcoming', 'ongoing', 'ended'])
  status?: string;
}
