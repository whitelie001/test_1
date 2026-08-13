import { IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsIn(['host', 'co_host', 'member'])
  role!: 'host' | 'co_host' | 'member';
}
