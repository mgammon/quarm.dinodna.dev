import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
// import { EventService } from './events.service';
import { UserModule } from '../user/user.module';
import { LogModule } from '../logs/log.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LogModule, UserModule, LocationModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
