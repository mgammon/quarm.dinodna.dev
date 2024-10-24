import { Module } from '@nestjs/common';
import { NpcController } from './npc.controller';
import { NpcService } from './npc.service';
import { Npc, SpawnEntry } from './npc.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rule } from './rule.entity';
import { RespawnService } from './respawn.service';
import { Zone } from '../zones/zone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Npc, SpawnEntry, Rule, Zone])],
  controllers: [NpcController],
  providers: [NpcService, RespawnService],
  exports: [NpcService],
})
export class NpcModule {}
