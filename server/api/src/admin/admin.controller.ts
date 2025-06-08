import { Controller, Param, Post } from '@nestjs/common';
import { AuctionService } from '../auctions/auction.service';
import { ApiUser, requireAdmin } from '../utils';
import { KeyValueService } from '../key-value/key-value.service';
import { User } from '../user/user.entity';

@Controller('api/admin')
export class AdminController {
  constructor(
    private auctionService: AuctionService,
    private keyValueService: KeyValueService,
  ) {}

  @Post(`/update-database`)
  public async updateDatabase(@ApiUser() user: User) {
    requireAdmin(user);
    this.keyValueService.autoUpdate();
    return 'Updating';
  }

  @Post(`/update-auction-prices`)
  public async updateAuctionPrices(@ApiUser() user: User) {
    requireAdmin(user);
    console.log('Updating item averages');
    await this.auctionService.updateAllAverages();
    console.log('Item averages updated');
    return 'Database updated';
  }

  @Post(`/rerun-auction-parsing/:days/:matchingText`)
  public async rerunAuctionParsing(
    @Param('matchingText') matchingText: string,
    @Param('days') days: string,
    @ApiUser() user: User,
  ) {
    requireAdmin(user);
    this.auctionService.rerunAuctionParsing(parseInt(days), matchingText);
  }
}
