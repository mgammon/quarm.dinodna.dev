import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillCap } from './skill-cap.entity';

@Module({
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [PlayerService],
  imports: [TypeOrmModule.forFeature([SkillCap])],
})
export class PlayerModule {}
