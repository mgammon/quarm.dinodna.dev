import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { LogModule } from '../logs/log.module';
import { LocationModule } from '../location/location.module';
import { CharacterModule } from '../characters/character.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [LogModule, LocationModule, UserModule, CharacterModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
