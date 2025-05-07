import { Controller, Param, Post, Headers } from '@nestjs/common';
import { AuctionService } from '../auctions/auction.service';
import { validateIsAdmin } from '../utils';
import { KeyValueService } from '../key-value/key-value.service';

@Controller('api/admin')
export class AdminController {
  constructor(
    private auctionService: AuctionService,
    private keyValueService: KeyValueService,
  ) {}

  @Post(`/update-database`)
  public async updateDatabase(@Headers('Authorization') auth: string) {
    validateIsAdmin(auth);
    this.keyValueService.autoUpdate();
    return 'Updating';
  }

  @Post(`/update-auction-prices`)
  public async updateAuctionPrices(@Headers('Authorization') auth: string) {
    validateIsAdmin(auth);
    console.log('Updating item averages');
    await this.auctionService.updateAllAverages();
    console.log('Item averages updated');
    return 'Database updated';
  }

  @Post(`/rerun-auction-parsing/:days/:matchingText`)
  public async rerunAuctionParsing(
    @Param('matchingText') matchingText: string,
    @Param('days') days: string,
    @Headers('Authorization') auth: string,
  ) {
    validateIsAdmin(auth);
    this.auctionService.rerunAuctionParsing(parseInt(days), matchingText);
  }
}
