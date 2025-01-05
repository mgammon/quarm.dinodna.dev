import { Controller, Get, Param } from '@nestjs/common';
import { PlayerService } from './player.service';
@Controller('api/player')
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  @Get(`/max-skills/:class/:level`)
  public async getMaxSkills(
    @Param('class') classId: string,
    @Param('level') level: string,
  ) {
    const classIdAsNumber = parseInt(classId);
    const levelAsNumber = parseInt(level);
    return this.playerService.getMaxSkills(classIdAsNumber, levelAsNumber);
  }
}
