import { Module, forwardRef } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { Auction, DailyAuction } from './auction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionParser } from './auction-parser.service';
import { ItemModule } from '../items/item.module';
import { Item } from '../items/item.entity';
import { Log } from '../logs/log.entity';
import { LogModule } from '../logs/log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, DailyAuction, Item, Log]),
    forwardRef(() => ItemModule),
    forwardRef(() => LogModule),
  ],
  providers: [AuctionService, AuctionParser],
  exports: [AuctionService],
})
export class AuctionModule {}
