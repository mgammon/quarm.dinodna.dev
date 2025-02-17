import { Module } from '@nestjs/common';
import { CharacterService } from './character.service';
import { Character, InventorySlot } from './character.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterController } from './character.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Character, InventorySlot])],
  controllers: [CharacterController],
  providers: [CharacterService],
  exports: [CharacterService],
})
export class CharacterModule {}
