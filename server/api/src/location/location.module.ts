import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { ZoneModule } from '../zones/zone.module';

@Module({
  imports: [ZoneModule],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
