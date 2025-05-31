import { Controller, Param, Post, Headers, Get } from '@nestjs/common';
import { AuctionService } from '../auctions/auction.service';
import { getApiKey } from '../utils';
import { KeyValueService } from '../key-value/key-value.service';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(
    private auctionService: AuctionService,
    private keyValueService: KeyValueService,
    private adminService: AdminService,
  ) {}

  @Post(`/update-database`)
  public async updateDatabase(@Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    this.adminService.validateIsAdmin(apiKey);
    this.keyValueService.autoUpdate();
    return 'Updating';
  }

  @Post(`/update-auction-prices`)
  public async updateAuctionPrices(@Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    this.adminService.validateIsAdmin(apiKey);
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
    const apiKey = getApiKey(auth);
    this.adminService.validateIsAdmin(apiKey);
    this.auctionService.rerunAuctionParsing(parseInt(days), matchingText);
  }

  @Get(`/permissions`)
  public async getPermissions(@Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    return this.adminService.getPermissions(apiKey);
  }
}
