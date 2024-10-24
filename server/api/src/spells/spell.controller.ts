import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { SpellService } from './spell.service';

@Controller('api/spells')
export class SpellController {
  constructor(private spellService: SpellService) {}

  @Get('/:id')
  getById(@Param('id') id: string) {
    const spellId = Number.parseInt(id);
    if (Number.isNaN(spellId)) {
      throw new NotFoundException();
    }
    return this.spellService.getById(spellId);
  }

  @Get('/search/:search')
  search(
    @Param('search') search: string,
    @Query('page') page = '0',
    @Query('size') size = '100',
  ) {
    return this.spellService.search(search, parseInt(page), parseInt(size));
  }
}
