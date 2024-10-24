import { Module, forwardRef } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { Auction, DailyAuction } from './auction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionParser } from './auction-parser.service';
import { ItemModule } from '../items/item.module';
import { Item } from '../items/item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, DailyAuction, Item]),
    forwardRef(() => ItemModule),
  ],
  providers: [AuctionService, AuctionParser],
  exports: [AuctionService],
})
export class AuctionModule {}
