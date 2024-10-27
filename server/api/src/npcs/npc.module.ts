import { Module } from '@nestjs/common';
import { NpcController } from './npc.controller';
import { NpcService } from './npc.service';
import { Npc, SpawnEntry } from './npc.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rule } from './rule.entity';
import { RespawnService } from './respawn.service';
import { Zone } from '../zones/zone.entity';
import { SpellModule } from '../spells/spell.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Npc, SpawnEntry, Rule, Zone]),
    SpellModule,
  ],
  controllers: [NpcController],
  providers: [NpcService, RespawnService],
  exports: [NpcService],
})
export class NpcModule {}
