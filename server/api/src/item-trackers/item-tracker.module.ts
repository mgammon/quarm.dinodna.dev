import { Module } from '@nestjs/common';
import { ItemTrackerService } from './item-tracker.service';
import { ItemTracker } from './item-tracker.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemTrackerController } from './item-tracker.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ItemTracker])],
  controllers: [ItemTrackerController],
  providers: [ItemTrackerService],
  exports: [ItemTrackerService],
})
export class ItemTrackerModule {}
