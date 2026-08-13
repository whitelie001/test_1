import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { MeetupsService } from '../meetups/meetups.service';
import { MyMeetupsQueryDto } from '../meetups/dto/pagination-query.dto';

/// 문서 5.3절에 `GET /users/me/meetups`가 모임 API 섹션에 포함되어 있어
/// 여기 둔다. 프로필/통계/배지(문서 4장) 등 나머지 사용자 API는 화면이
/// 실제로 필요해지는 단계(Phase 7)에서 추가한다.
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly meetupsService: MeetupsService) {}

  @Get('meetups')
  listMyMeetups(
    @CurrentUserId() userId: string,
    @Query() query: MyMeetupsQueryDto,
  ) {
    return this.meetupsService.listMyMeetups(userId, query.role);
  }
}
