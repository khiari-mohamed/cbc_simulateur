import { Controller, Get } from '@nestjs/common';

@Controller('system')
export class SystemController {
  @Get('time')
  getServerTime() {
    return {
      serverTime: new Date().toISOString(),
      timestamp: Date.now(),
    };
  }
}
