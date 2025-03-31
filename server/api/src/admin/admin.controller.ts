import { Controller, Get, Param } from '@nestjs/common';
import { DatabaseUpdateService } from './databaseUpdate.service';
import { AuctionService } from '../auctions/auction.service';
import { config } from '../config';

@Controller('api/admin')
export class AdminController {
  constructor(
    private databaseUpdateService: DatabaseUpdateService,
    private auctionService: AuctionService,
  ) {}

  @Get(`/update-database/${config.apiKey}`)
  public async updateDatabase() {
    console.log('Writing new db-update.sql from sql dump');
    await this.databaseUpdateService.update();
    console.log('Done writing new db-update.sql');
    // console.log('Updating item averages');
    // await this.auctionService.updateAllAverages();
    // console.log('Item averages updated');
    return 'Done writing new db-update.sql';
  }

  @Get(`/update-auction-prices/${config.apiKey}`)
  public async updateAuctionPrices() {
    console.log('Updating item averages');
    await this.auctionService.updateAllAverages();
    console.log('Item averages updated');
    return 'Database updated';
  }

  @Get(`/rerun-auction-parsing/:days/:matchingText/${config.apiKey}`)
  public async rerunAuctionParsing(
    @Param('matchingText') matchingText: string,
    @Param('days') days: string,
  ) {
    this.auctionService.rerunAuctionParsing(parseInt(days), matchingText);
  }
}
