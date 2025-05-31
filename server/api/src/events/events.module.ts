import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
// import { EventService } from './events.service';
import { LogModule } from '../logs/log.module';
import { LocationModule } from '../location/location.module';
import { AdminModule } from '../admin/admin.module';
import { CharacterModule } from '../characters/character.module';

@Module({
  imports: [LogModule, LocationModule, AdminModule, CharacterModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
