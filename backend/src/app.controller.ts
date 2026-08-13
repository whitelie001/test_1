import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /// 헬스체크. 로드밸런서/모니터링용.
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
