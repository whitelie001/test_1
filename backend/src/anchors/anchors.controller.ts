import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { AnchorsService } from './anchors.service';
import { AnchorLocationDto } from './dto/anchor-location.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AnchorsController {
  constructor(private readonly anchorsService: AnchorsService) {}

  @Post('meetups/:id/anchor/activate')
  activate(
    @Param('id') meetupId: string,
    @CurrentUserId() userId: string,
    @Body() dto: AnchorLocationDto,
  ) {
    return this.anchorsService.activate(meetupId, userId, dto);
  }

  @Put('anchors/:anchorId/location')
  updateLocation(
    @Param('anchorId') anchorId: string,
    @CurrentUserId() userId: string,
    @Body() dto: AnchorLocationDto,
  ) {
    return this.anchorsService.updateLocation(anchorId, userId, dto);
  }
}
