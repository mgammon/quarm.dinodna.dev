import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LogService } from './log.service';
import { config } from '../config';

@Controller('api/logs')
export class LogController {
  constructor(private logService: LogService) {}

  @Get('/:before')
  getLogs(@Param('before') before: string) {
    return this.logService.getLogs();
  }

  @Post('/')
  addLogs(@Query('apiKey') apiKey: string, @Body() log: string[]) {
    if (apiKey !== config.apiKey) {
      throw new NotImplementedException();
    }

    console.log(log);

    return this.logService.onLogs(log);
  }
}
