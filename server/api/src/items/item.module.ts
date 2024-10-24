import { Module, forwardRef } from '@nestjs/common';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { Item } from './item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionModule } from '../auctions/auction.module';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), forwardRef(() => AuctionModule)],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
