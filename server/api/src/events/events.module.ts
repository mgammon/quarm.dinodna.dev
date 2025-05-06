import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
// import { EventService } from './events.service';
import { LogModule } from '../logs/log.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LogModule, LocationModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
