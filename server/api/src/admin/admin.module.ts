import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuctionModule } from '../auctions/auction.module';
import { KeyValueModule } from '../key-value/key-value-module';

@Module({
  controllers: [AdminController],
  imports: [AuctionModule, KeyValueModule],
})
export class AdminModule {}
