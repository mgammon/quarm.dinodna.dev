import { Module } from '@nestjs/common';
import { DatabaseUpdateService } from './databaseUpdate.service';
import { AdminController } from './admin.controller';
import { AuctionModule } from '../auctions/auction.module';

@Module({
  controllers: [AdminController],
  providers: [DatabaseUpdateService],
  imports: [AuctionModule],
})
export class AdminModule {}
