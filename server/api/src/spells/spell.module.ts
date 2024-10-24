import { Module } from '@nestjs/common';
import { SpellController } from './spell.controller';
import { SpellService } from './spell.service';
import { SpellNew } from './spell-new.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../items/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpellNew, Item])],
  controllers: [SpellController],
  providers: [SpellService],
})
export class SpellModule {}
