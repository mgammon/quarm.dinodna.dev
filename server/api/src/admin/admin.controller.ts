import { Controller, Get } from '@nestjs/common';
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
    console.log('Updating Quarm DBB');
    await this.databaseUpdateService.update();
    console.log('Quarm DB updated');
    console.log('Updating item averages');
    await this.auctionService.updateAllAverages();
    console.log('Item averages updated');
    return 'Database updated';
  }

  @Get(`/update-auction-prices/${config.apiKey}`)
  public async updateAuctionPrices() {
    console.log('Updating item averages');
    await this.auctionService.updateAllAverages();
    console.log('Item averages updated');
    return 'Database updated';
  }
}
