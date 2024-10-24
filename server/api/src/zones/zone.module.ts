import { Module } from '@nestjs/common';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';
import { Zone } from './zone.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NpcModule } from '../npcs/npc.module';

@Module({
  imports: [TypeOrmModule.forFeature([Zone]), NpcModule],
  controllers: [ZoneController],
  providers: [ZoneService],
  exports: [ZoneService],
})
export class ZoneModule {}
