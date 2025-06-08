import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
  Delete,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { ItemTrackerDto } from './item-tracker.entity';
import { ItemTrackerService } from './item-tracker.service';
import { User } from '../user/user.entity';
import { ApiUser, requireUser } from '../utils';

@Controller('api/item-trackers')
export class ItemTrackerController {
  constructor(private itemTrackerService: ItemTrackerService) {}

  @Get('/')
  getAll(@ApiUser() user: User) {
    requireUser(user);
    return this.itemTrackerService.getByUserId(user.id);
  }

  @Post('/')
  async create(@Body() itemTracker: ItemTrackerDto, @ApiUser() user: User) {
    requireUser(user);
    return this.itemTrackerService.create(itemTracker, user.id);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() itemTracker: ItemTrackerDto, @ApiUser() user: User) {
    requireUser(user);
    const itemTrackerId = Number.parseInt(id);
    if (Number.isNaN(itemTrackerId)) {
      throw new BadRequestException();
    }

    return this.itemTrackerService.update(itemTrackerId, user.id, itemTracker);
  }

  @Delete('/:id')
  deleteById(@Param('id') id: string, @ApiUser() user: User) {
    requireUser(user);
    const itemTrackerId = Number.parseInt(id);
    if (Number.isNaN(itemTrackerId)) {
      throw new BadRequestException();
    }
    return this.itemTrackerService.deleteById(itemTrackerId, user.id);
  }
}
