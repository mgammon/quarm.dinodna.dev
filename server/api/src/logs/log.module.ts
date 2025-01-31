import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogService } from './log.service';
import { AuctionModule } from '../auctions/auction.module';
import { LogController } from './log.controller';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Log]),
    forwardRef(() => AuctionModule),
    FeedbackModule,
  ],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
