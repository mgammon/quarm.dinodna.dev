import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Query,
} from '@nestjs/common';
import { LogService } from './log.service';
import { config } from '../config';

@Controller('api/logs')
export class LogController {
  constructor(private logService: LogService) {}

  @Get('/raw')
  getRawLogs(
    @Query('before') before: string,
    @Query('after') after: string,
    @Query('size') size: string,
  ) {
    if (before && after) {
      return 'You can only specify either before OR after, not both.';
    }
    if (!before && !after) {
      const recentLogs = this.logService.getLogs();

      const latestId = recentLogs[recentLogs.length - 1].id;
      if (latestId) {
        const sizeNumber = Math.min(100, parseInt(size || '10'));
        return this.logService.getRawLogsBefore(latestId + 1, sizeNumber);
      } else {
        return [];
      }
    } else if (before) {
      return this.logService.getRawLogsBefore(
        parseInt(before),
        Math.min(100, parseInt(size || '10')),
      );
    } else if (after) {
      return this.logService.getRawLogsAfter(
        parseInt(after),
        Math.min(100, parseInt(size || '10')),
      );
    }
  }

  getLogsFunction(before: string, after: string, size: string) {
    if (before && after) {
      return 'You can only specify either before OR after, not both.';
    }
    if (before) {
      return this.logService.getLogsBefore(
        parseInt(before),
        Math.min(100, parseInt(size || '10')),
      );
    } else if (after) {
      return this.logService.getLogsAfter(
        parseInt(after),
        Math.min(100, parseInt(size || '10')),
      );
    }
    const recentLogs = this.logService.getLogs();
    const sizeNumber = parseInt(size);
    if (sizeNumber) {
      return recentLogs.slice(recentLogs.length - Math.min(100, sizeNumber));
    }
    return this.logService.getLogs();
  }

  @Get('/')
  getLogs(
    @Query('before') before: string,
    @Query('after') after: string,
    @Query('size') size: string,
  ) {
    return this.getLogsFunction(before, after, size);
  }

  @Get('/:before')
  getLogsOld(
    @Query('before') before: string,
    @Query('after') after: string,
    @Query('size') size: string,
  ) {
    return this.getLogsFunction(before, after, size);
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
