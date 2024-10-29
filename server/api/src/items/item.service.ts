import * as _ from 'lodash';
import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  Equal,
  FindOptionsWhere,
  In,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Raw,
  Repository,
} from 'typeorm';
import {
  Item,
  LootDrop,
  LootDropEntry,
  LootTable,
  LootTableEntry,
} from './item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MerchantEntry,
  Npc,
  Spawn,
  SpawnEntry,
  SpawnGroup,
} from '../npcs/npc.entity';
import {
  compareNumber,
  idToBitmask,
  sanitizeSearch,
  selectRelevance,
} from '../utils';
import { EffectFilter, ItemSearchOptions } from './item.controller';
import { SpellNew } from '../spells/spell-new.entity';
import { AuctionService } from '../auctions/auction.service';
import * as moment from 'moment';

@Injectable()
export class ItemService {
  private minimumSelections = {
    loot: [
      'item.id',
      'lootDropEntry.lootdrop_id',
      'lootDrop.id',
      'lootTableEntry.loottable_id',
      'lootTable.id',
      'npc.id',
      'spawnEntry.npcID',
      'spawnGroup.id',
      'spawn.spawngroupID',
    ],
    merchants: [
      'item.id',
      'merchantEntry.item',
      'npc.id',
      'spawnEntry.npcID',
      'spawnGroup.id',
      'spawn.spawngroupID',
    ],
  };

  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @Inject(forwardRef(() => AuctionService))
    private auctionService: AuctionService,
  ) {}

  async getAllItemNames(): Promise<{ id: number; name: string }[]> {
    return this.itemRepository.query(
      'SELECT id, REPLACE(REPLACE(LOWER(name), "-", " "), "`", " " ) as name from items ORDER BY LENGTH(name) DESC',
    );
  }

  async search(
    search: string,
    slots: number[] = [],
    classes: number[] = [],
    races: number[] = [],
    page: number = 0,
    size: number = 100,
  ) {
    size = Math.min(100, size) || 100;
    search = sanitizeSearch(search);
    if (!search) {
      return [];
    }

    let where = {};
    if (slots.length) {
      where = { ...where, ...this.slotFilter([slots]) };
    }
    if (classes.length) {
      where = { ...where, ...this.classFilter(classes) };
    }
    if (races.length) {
      where = { ...where, ...this.raceFilter(races) };
    }

    const results = await this.itemRepository
      .createQueryBuilder('item')
      .select()
      .where(where)
      .addSelect(selectRelevance(search), 'item_relevance')
      .orderBy('item_relevance', 'DESC')
      // .where(`searchable_name LIKE :search`, { search: `%${search}%` }) // Despite relevance, it should partially match the name.
      .skip(page * size)
      .take(size)
      .getMany();

    return results.filter((r) => r.relevance > 0);
  }

  magicFilter(isMagic?: boolean): FindOptionsWhere<Item> {
    if (isMagic === true) {
      return { magic: MoreThan(0) };
    } else if (isMagic === false) {
      return { magic: LessThanOrEqual(0) };
    } else {
      return null;
    }
  }

  noDropFilter(noDrop?: boolean): FindOptionsWhere<Item> {
    if (noDrop === true) {
      return { nodrop: Equal(0) };
    } else if (noDrop === false) {
      return { nodrop: Not(Equal(0)) };
    } else {
      return null;
    }
  }

  noRentFilter(noRent?: boolean): FindOptionsWhere<Item> {
    if (noRent === true) {
      return { norent: Equal(0) };
    } else if (noRent === false) {
      return { norent: Not(Equal(0)) };
    } else {
      return null;
    }
  }

  loreFilter(lore?: boolean): FindOptionsWhere<Item> {
    if (lore === true) {
      return { lore: Like('*%') };
    } else if (lore === false) {
      return { lore: Not(Like('*%')) };
    } else {
      return null;
    }
  }

  itemTypeFilter(itemType?: number[]): FindOptionsWhere<Item> {
    if (!itemType?.length) {
      return null;
    }
    return { itemtype: In(itemType) };
  }

  classFilter(classIds?: number[]): FindOptionsWhere<Item> {
    if (!classIds?.length) {
      return null;
    }
    const classFilterBitmask = classIds
      .map((id) => idToBitmask(id - 1))
      .reduce((sum, bit) => sum + bit, 0);
    return {
      classes: Raw((alias) => `${alias} & :classFilterBitmask > 0`, {
        classFilterBitmask,
      }),
    };
  }

  raceFilter(raceIds?: number[]): FindOptionsWhere<Item> {
    if (!raceIds?.length) {
      return null;
    }
    const raceFilterBitmask = raceIds
      .map((id) => idToBitmask(id))
      .reduce((sum, bit) => sum + bit, 0);
    return {
      races: Raw((alias) => `${alias} & :raceFilterBitmask > 0`, {
        raceFilterBitmask,
      }),
    };
  }

  slotFilter(slotIds?: number[][]): FindOptionsWhere<Item> {
    if (!slotIds?.length) {
      return null;
    }

    const flattenedSlotIds: number[] = _.flatten(slotIds);
    const slotFilterBitmask = flattenedSlotIds
      .map((id) => idToBitmask(id))
      .reduce((sum, bit) => sum + bit, 0);
    return {
      slots: Raw((alias) => `${alias} & :slotFilterBitmask > 0`, {
        slotFilterBitmask,
      }),
    };
  }

  addEffectFilter(
    allFilters: FindOptionsWhere<Item>,
    effectFilter: EffectFilter,
  ): FindOptionsWhere<Item> | FindOptionsWhere<Item>[] {
    if (!effectFilter) {
      return allFilters;
    }

    const { baseValue } = effectFilter;
    const baseValueOperator =
      baseValue === 'amountNegative'
        ? LessThan(0)
        : baseValue === 'percentNegative'
          ? LessThan(100)
          : baseValue === 'amountPositive'
            ? MoreThanOrEqual(0)
            : MoreThanOrEqual(100);

    const effectFilters: FindOptionsWhere<SpellNew>[] = [];
    for (let i = 1; i <= 12; i++) {
      const effectIndexFilter = {
        [`effectid${i}`]: Equal(effectFilter.id),
        [`effect_base_value${i}`]: baseValueOperator,
      };
      if (effectFilter.hasDuration) {
        effectIndexFilter.buffdurationformula = MoreThan(0);
      } else if (effectFilter.hasDuration === false) {
        effectIndexFilter.buffdurationformula = Equal(0);
      }
      effectFilters.push(effectIndexFilter);
    }

    return [
      {
        ...allFilters,
        clickEffect: effectFilters,
      },
      {
        ...allFilters,
        wornEffect: effectFilters,
      },
      {
        ...allFilters,
        procEffect: effectFilters,
      },
      {
        ...allFilters,
        scrollEffect: effectFilters,
      },
    ];
  }

  searchFilter(search: string): FindOptionsWhere<Item> {
    return search ? { searchable_name: Like(`%${search}%`) } : null;
  }

  async complexSearch(options: ItemSearchOptions) {
    const size = Math.min(options.size, 50);
    options.search = sanitizeSearch(options.search);

    if (options.stats.average7d.value) {
      options.stats.average7d.value = options.stats.average7d.value * 1000;
    }
    if (options.stats.average30d.value) {
      options.stats.average30d.value = options.stats.average30d.value * 1000;
    }

    // Build all the number comparison filters
    const numberFilters: FindOptionsWhere<Item>[] = [
      { ac: compareNumber(options.stats.ac) },
      { asta: compareNumber(options.stats.sta) },
      { astr: compareNumber(options.stats.str) },
      { adex: compareNumber(options.stats.dex) },
      { aagi: compareNumber(options.stats.agi) },
      { acha: compareNumber(options.stats.cha) },
      { aint: compareNumber(options.stats.int) },
      { awis: compareNumber(options.stats.wis) },
      { fr: compareNumber(options.stats.fr) },
      { cr: compareNumber(options.stats.cr) },
      { mr: compareNumber(options.stats.mr) },
      { dr: compareNumber(options.stats.dr) },
      { pr: compareNumber(options.stats.pr) },
      { hp: compareNumber(options.stats.hp) },
      { mana: compareNumber(options.stats.mana) },
      { damage: compareNumber(options.stats.dmg) },
      { delay: compareNumber(options.stats.delay) },
      { weight: compareNumber(options.stats.weight) },
      { average7d: compareNumber(options.stats.average7d) },
      { average30d: compareNumber(options.stats.average30d) },
    ].filter(
      (filter) => filter && Object.keys(filter).some((key) => !!filter[key]),
    );
    // Combine individual number comparison filters into one
    const allNumberFilters = numberFilters.reduce(
      (all, filter) => ({ ...all, ...filter }),
      {} as FindOptionsWhere<Item>,
    );

    // Combine all the filters together (except effects, because they're complicated.)
    const allNonEffectFilters: FindOptionsWhere<Item> = {
      ...allNumberFilters,
      ...this.searchFilter(options.search),
      ...this.classFilter(options.classes),
      ...this.raceFilter(options.races),
      ...this.slotFilter(options.slots),
      ...this.itemTypeFilter(options.itemType),
      ...this.magicFilter(options.magic),
      ...this.noDropFilter(options.noDrop),
      ...this.noRentFilter(options.noRent),
      ...this.loreFilter(options.lore),
    };
    // Thennn add effects
    const allFilters = this.addEffectFilter(
      allNonEffectFilters,
      options.effect,
    );

    const order = {
      [options.sort.field]: options.sort.order === 1 ? 'ASC' : 'DESC',
    };

    return this.itemRepository.find({
      where: allFilters,
      skip: options.page * size,
      take: size,
      order,
    });
  }

  async getItemSnippet(itemId: number) {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: {
        wornEffect: true,
        clickEffect: true,
        procEffect: true,
        scrollEffect: true,
      },
    });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    return item;
  }

  async getById(itemId: number) {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: {
        wornEffect: true,
        clickEffect: true,
        procEffect: true,
        scrollEffect: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const itemLootDrops = await this.getLootDrops(itemId);
    const itemMerchants = await this.getMerchants(itemId);
    let dailyAuctions = await this.auctionService.getDailyAuctions(
      itemId,
      moment().subtract(1, 'days').toDate(),
    );
    if (dailyAuctions.length < 3) {
      dailyAuctions = await this.auctionService.getDailyAuctions(
        itemId,
        moment().subtract(3, 'days').toDate(),
      );
    }
    if (dailyAuctions.length < 3) {
      dailyAuctions = await this.auctionService.getDailyAuctions(
        itemId,
        moment().subtract(7, 'days').toDate(),
      );
    }
    if (dailyAuctions.length < 3) {
      dailyAuctions = await this.auctionService.getDailyAuctions(
        itemId,
        moment().subtract(30, 'days').toDate(),
      );
    }
    const auctionSummaries = await this.auctionService.getAuctionSummaries(
      itemId,
      90,
    );
    item.lootDropEntries = itemLootDrops?.lootDropEntries;
    item.merchantEntries = itemMerchants?.merchantEntries;
    item.dailyAuctions = dailyAuctions;
    item.auctionSummaries = auctionSummaries;
    return item;
  }

  getAllByIds(ids: number[]) {
    return this.itemRepository.find({ where: { id: In(ids) } });
  }

  private getLootDrops(itemId: number) {
    return this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndMapMany(
        'item.lootDropEntries',
        LootDropEntry,
        'lootDropEntry',
        'item.id = lootDropEntry.item_id',
      )
      .leftJoinAndMapMany(
        'lootDropEntry.lootDrop',
        LootDrop,
        'lootDrop',
        'lootDropEntry.lootdrop_id = lootDrop.id',
      )
      .leftJoinAndMapMany(
        'lootDrop.lootTableEntries',
        LootTableEntry,
        'lootTableEntry',
        'lootDrop.id = lootTableEntry.lootdrop_id',
      )
      .leftJoinAndMapMany(
        'lootTableEntry.lootTable',
        LootTable,
        'lootTable',
        'lootTableEntry.loottable_id = lootTable.id',
      )
      .leftJoinAndMapMany(
        'lootTable.npcs',
        Npc,
        'npc',
        'lootTable.id = npc.loottable_id',
      )
      .leftJoinAndMapMany(
        'npc.spawnEntries',
        SpawnEntry,
        'spawnEntry',
        'npc.id = spawnEntry.npcID',
      )
      .leftJoinAndMapMany(
        'spawnEntry.spawnGroup',
        SpawnGroup,
        'spawnGroup',
        'spawnEntry.spawngroupID = spawnGroup.id',
      )
      .leftJoinAndMapMany(
        'spawnGroup.spawns',
        Spawn,
        'spawn',
        'spawnGroup.id = spawn.spawngroupID',
      )
      .select([
        'npc.name',
        'npc.level',
        'npc.maxlevel',
        'spawn.zone',
        'spawn.x',
        'spawn.y',
        'spawn.z',
        'lootDropEntry.chance',
        'lootDropEntry.multiplier',
        'lootTableEntry.probability',
        'lootTableEntry.multiplier',
        'lootTable.mincash',
        'lootTable.maxcash',
        'lootTable.avgcoin',
        'spawn.respawntime',
        ...this.minimumSelections.loot,
      ])
      .where('item.id = :itemId', { itemId })
      .getOne();
  }

  private getMerchants(itemId: number) {
    return this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndMapMany(
        'item.merchantEntries',
        MerchantEntry,
        'merchantEntry',
        'item.id = merchantEntry.item',
      )
      .leftJoinAndMapMany(
        'merchantEntry.npcs',
        Npc,
        'npc',
        'merchantEntry.merchantid = npc.merchant_id',
      )
      .leftJoinAndMapMany(
        'npc.spawnEntries',
        SpawnEntry,
        'spawnEntry',
        'npc.id = spawnEntry.npcID',
      )
      .leftJoinAndMapMany(
        'spawnEntry.spawnGroup',
        SpawnGroup,
        'spawnGroup',
        'spawnEntry.spawngroupID = spawnGroup.id',
      )
      .leftJoinAndMapMany(
        'spawnGroup.spawns',
        Spawn,
        'spawn',
        'spawnGroup.id = spawn.spawngroupID',
      )
      .where('item.id = :itemId', { itemId })
      .select([
        'npc.name',
        'spawn.zone',
        'spawn.x',
        'spawn.y',
        'spawn.z',
        'spawn.respawntime',
        ...this.minimumSelections.merchants,
      ])
      .getOne();
  }
}
