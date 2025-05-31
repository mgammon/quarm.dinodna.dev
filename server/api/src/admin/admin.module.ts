import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuctionModule } from '../auctions/auction.module';
import { KeyValueModule } from '../key-value/key-value-module';
import { Admin } from './admin.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
  imports: [AuctionModule, KeyValueModule, TypeOrmModule.forFeature([Admin])],
})
export class AdminModule {}
