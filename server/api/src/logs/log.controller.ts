import { Controller, Get, Param } from '@nestjs/common';
import { LogService } from './log.service';

@Controller('api/logs')
export class LogController {
  constructor(private logService: LogService) {}

  @Get('/:before')
  getLogs(@Param('before') before: string) {
    return this.logService.getLogs();
  }
}
