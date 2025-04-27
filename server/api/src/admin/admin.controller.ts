import { Controller, Param, Post, Headers } from '@nestjs/common';
import { DatabaseUpdater } from './database-updater';
import { AuctionService } from '../auctions/auction.service';
import { validateIsAdmin } from '../utils';

@Controller('api/admin')
export class AdminController {
  private databaseUpdater: DatabaseUpdater;
  constructor(private auctionService: AuctionService) {
    this.databaseUpdater = new DatabaseUpdater();
  }

  @Post(`/update-database`)
  public async updateDatabase(@Headers('Authorization') auth: string) {
    validateIsAdmin(auth);
    this.databaseUpdater.initializeQuarmData(true);
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
