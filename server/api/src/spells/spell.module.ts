import { Module } from '@nestjs/common';
import { SpellController } from './spell.controller';
import { SpellService } from './spell.service';
import { SpellNew } from './spell-new.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../items/item.entity';
import { NpcSpellsEntry, NpcSpells } from './npc-spells.entity';
import { ItemModule } from '../items/item.module';

@Module({
  imports: [TypeOrmModule.forFeature([SpellNew, Item, NpcSpells, NpcSpellsEntry]), ItemModule],
  controllers: [SpellController],
  providers: [SpellService],
  exports: [SpellService],
})
export class SpellModule {}
