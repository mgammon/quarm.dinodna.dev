import { Module } from '@nestjs/common';
import { KeyValueService } from './key-value.service';
import { KeyValue } from './key-value';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [TypeOrmModule.forFeature([KeyValue]), FeedbackModule],
  providers: [KeyValueService],
  exports: [KeyValueService],
})
export class KeyValueModule {}
