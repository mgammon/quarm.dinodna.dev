import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuctionModule } from '../auctions/auction.module';

@Module({
  controllers: [AdminController],
  providers: [],
  imports: [AuctionModule],
})
export class AdminModule {}
