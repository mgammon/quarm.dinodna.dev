import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
  BadRequestException,
  Delete,
  Put,
} from '@nestjs/common';
import { getApiKey } from '../utils';
import { ItemTrackerDto } from './item-tracker.entity';
import { ItemTrackerService } from './item-tracker.service';

@Controller('api/item-trackers')
export class ItemTrackerController {
  constructor(private itemTrackerService: ItemTrackerService) {}

  @Get('/')
  getByApiKey(@Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    if (!apiKey) {
      throw new BadRequestException();
    }
    return this.itemTrackerService.getByApiKey(apiKey);
  }

  @Post('/')
  create(
    @Body() itemTracker: ItemTrackerDto,
    @Headers('Authorization') auth: string,
  ) {
    const apiKey = getApiKey(auth);
    if (!apiKey) {
      throw new BadRequestException();
    }
    return this.itemTrackerService.create(itemTracker, apiKey);
  }

  @Put('/:id')
  update(
    @Param('id') id: string,
    @Body() itemTracker: ItemTrackerDto,
    @Headers('Authorization') auth: string,
  ) {
    const apiKey = getApiKey(auth);
    const itemTrackerId = Number.parseInt(id);
    if (Number.isNaN(itemTrackerId) || !apiKey) {
      throw new BadRequestException();
    }

    return this.itemTrackerService.update(itemTrackerId, apiKey, itemTracker);
  }

  @Delete('/:id')
  deleteById(@Param('id') id: string, @Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    const itemTrackerId = Number.parseInt(id);
    if (Number.isNaN(itemTrackerId) || !apiKey) {
      throw new BadRequestException();
    }
    return this.itemTrackerService.deleteById(itemTrackerId, apiKey);
  }
}
