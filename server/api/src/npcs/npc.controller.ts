import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Post,
  Query,
} from '@nestjs/common';
import { NpcService } from './npc.service';
import { ComparableNumber } from '../utils';

export interface NpcSearchOptions {
  sort: { field: string; order: 1 | -1 };
  page: number;
  size: number;
  zones?: string[];
  search?: string;
  races?: number[];
  classes?: number[];
  bodyTypes?: number[];
  runspeeds?: ComparableNumber[][];
  seesInvis?: boolean;
  seesIvu?: boolean;
  charmable?: boolean;
  // immuneToFear?: boolean;
  fast?: boolean;
  slow?: boolean;
  minLevel: ComparableNumber;
  maxLevel: ComparableNumber;
  exactMatch?: boolean;
}

@Controller('api/npcs')
export class NpcController {
  constructor(private npcService: NpcService) {}

  @Get('/spawn-entries')
  getSpawnEntries(
    @Query(
      'spawnGroupIds',
      new ParseArrayPipe({ items: Number, separator: ',' }),
    )
    spawnGroupIds: number[],
  ) {
    return this.npcService.getSpawnEntries(spawnGroupIds);
  }

  @Get('/:id')
  getById(@Param('id') id: string) {
    const npcId = Number.parseInt(id);
    if (Number.isNaN(npcId)) {
      throw new NotFoundException();
    }
    return this.npcService.getById(npcId);
  }

  @Get('/search/:search')
  search(
    @Param('search') search: string,
    @Query('page') page = '0',
    @Query('size') size = '100',
  ) {
    return this.npcService.search(search, parseInt(page), parseInt(size));
  }

  @Post('/search')
  complexSearch(@Body() options: NpcSearchOptions) {
    return this.npcService.complexSearch(options);
  }
}
