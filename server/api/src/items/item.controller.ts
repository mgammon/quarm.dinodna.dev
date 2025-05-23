import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ItemService } from './item.service';
import {
  ComparableNumber,
  getClassesAsStrings,
  getPlayableRacesAsStrings,
} from '../utils';
import * as _ from 'lodash';
import * as Papa from 'papaparse';
import { Item } from './item.entity';

export interface EffectFilter {
  id: number;
  baseValue:
    | 'percentNegative'
    | 'percentPositive'
    | 'amountNegative'
    | 'amountPositive';
  hasDuration?: boolean;
}

export interface ItemSearchOptions {
  sort: { field: string; order: 1 | -1 };
  page: number;
  size: number;
  search?: string;
  races?: number[];
  classes?: number[];
  slots?: number[][];
  itemType?: number[];
  effect?: EffectFilter; // like haste, damage, heal, etc.
  stats: {
    sta: ComparableNumber;
    str: ComparableNumber;
    dex: ComparableNumber;
    agi: ComparableNumber;
    cha: ComparableNumber;
    int: ComparableNumber;
    wis: ComparableNumber;
    mana: ComparableNumber;
    hp: ComparableNumber;
    ac: ComparableNumber;
    dmg: ComparableNumber;
    delay: ComparableNumber;
    mr: ComparableNumber;
    fr: ComparableNumber;
    cr: ComparableNumber;
    pr: ComparableNumber;
    dr: ComparableNumber;
    weight: ComparableNumber;
    average7d: ComparableNumber;
    average30d: ComparableNumber;
  };
  magic?: boolean;
  lore?: boolean;
  noDrop?: boolean;
  noRent?: boolean;
  sources?: ('vendor' | 'drop' | 'tradeskill' | 'unknown')[];
  effectType?: 'click' | 'worn' | 'proc' | 'scroll';
}

@Controller('api/items')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Get('/csv')
  @Header('content-type', 'text/csv')
  async getItemsCsv(
    @Query('itemIds') ids: string[],
    @Query('properties') properties: (keyof Item)[],
  ) {
    if (!ids || ids.length === 0 || !properties || properties.length === 0) {
      return [];
    }
    if (typeof ids === 'string') {
      ids = (ids as string).split(',');
    }
    if (typeof properties === 'string') {
      properties = (properties as string).split(',') as (keyof Item)[];
    }
    const items = await this.itemService.getAllByIds(
      ids.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
    );

    const data = items.map((item) => _.pick(item, properties));
    if (properties.includes('classes')) {
      data.forEach((item) => {
        item.classes = getClassesAsStrings(item.classes).join(', ') as any;
      });
    }
    if (properties.includes('races')) {
      data.forEach((item) => {
        item.races = getPlayableRacesAsStrings(item.races).join(', ') as any;
      });
    }
    return Papa.unparse(data, { delimiter: ';' });
  }

  @Get('/:id')
  getById(
    @Param('id') id: string,
    @Query('includeAuctions') includeAuctionsParam: string,
  ) {
    const itemId = Number.parseInt(id);
    if (Number.isNaN(itemId)) {
      throw new NotFoundException();
    }
    const includeAuctions = includeAuctionsParam === 'true';
    return this.itemService.getById(itemId, includeAuctions);
  }

  @Get('/')
  getAllByIds(@Query('ids') ids: string[]) {
    if (!ids) {
      return [];
    }
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    return this.itemService.getAllByIds(ids.map((id) => parseInt(id)));
  }

  @Get('/:id/snippet')
  getItemSnippet(@Param('id') id: string) {
    const itemId = Number.parseInt(id);
    if (Number.isNaN(itemId)) {
      throw new NotFoundException();
    }
    return this.itemService.getItemSnippet(itemId);
  }

  @Get('/search/:search')
  search(
    @Param('search') search: string,
    @Query('page') page = '0',
    @Query('size') size = '100',
    @Query('slots') slots: string[] = [],
    @Query('classes') classes: string[] = [],
    @Query('races') races: string[] = [],
  ) {
    if (typeof slots === 'string') {
      slots = [slots];
    }
    if (typeof classes === 'string') {
      classes = [classes];
    }
    if (typeof races === 'string') {
      races = [races];
    }
    return this.itemService.search(
      search,
      slots.map(parseInt),
      classes.map(parseInt),
      races.map(parseInt),
      parseInt(page),
      parseInt(size),
    );
  }

  @Post('/search')
  complexSearch(@Body() options: ItemSearchOptions) {
    // UI 0.1 weight is actually DB 1 weight
    if (options.stats.weight.value !== undefined) {
      options.stats.weight.value = options.stats.weight.value * 10;
    }

    return this.itemService.complexSearch(options);
  }
}
