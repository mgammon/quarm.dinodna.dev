import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogService } from './log.service';
import { AuctionModule } from '../auctions/auction.module';
import { LogController } from './log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Log]), AuctionModule],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
