import { Injectable, NotFoundException } from '@nestjs/common';
import {
  And,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  Like,
  MoreThan,
  Or,
  Repository,
} from 'typeorm';
import {
  MerchantEntry,
  Npc,
  Spawn,
  SpawnEntry,
  SpawnGroup,
} from './npc.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Item,
  LootDrop,
  LootDropEntry,
  LootTable,
  LootTableEntry,
} from '../items/item.entity';
import {
  ComparableNumber,
  compareNumber,
  sanitizeSearch,
  selectRelevance,
} from '../utils';
import { NpcSearchOptions } from './npc.controller';
import { isAllowedZone } from '../zones/zones';
import { RespawnService } from './respawn.service';
import { SpellService } from '../spells/spell.service';

@Injectable()
export class NpcService {
  private minimumSelections = {
    spawns: ['spawnEntry.npcID', 'spawnGroup.id', 'spawn.spawngroupID'],
    loot: [
      'npc.loottable_id',
      'lootTable.id',
      'lootTableEntry.loottable_id',
      'lootDrop.id',
      'lootDropEntry.lootdrop_id',
      'item.id',
    ],
    merchant: ['npc.merchant_id', 'merchantEntry.item', 'item.id'],
  };

  constructor(
    @InjectRepository(Npc) private npcRepository: Repository<Npc>,
    @InjectRepository(SpawnEntry)
    private spawnEntryRepository: Repository<SpawnEntry>,
    private respawnService: RespawnService,
    private spellService: SpellService,
  ) {}

  async search(search: string, page: number = 0, size: number = 100) {
    size = Math.min(100, size) || 100;
    search = sanitizeSearch(search);
    if (!search) {
      return [];
    }

    // Search juuuust for the IDs
    const npcRelevance = await this.npcRepository
      .createQueryBuilder('npc')
      .select()
      .addSelect(selectRelevance(search), 'npc_relevance')
      .orderBy('npc_relevance', 'DESC')
      // .where(`searchable_name LIKE :search`, { search: `%${search}%` }) // Despite relevance, it should partially match the name.
      .skip(page * size)
      .take(size)
      .getMany();

    // Then load the page of NPCs with all the joins
    const results = await this.npcRepository.find({
      where: {
        id: In(npcRelevance.map((npc) => npc.id)),
        spawnEntries: {
          spawnGroup: { spawns: { min_expansion: LessThanOrEqual(1) } },
        },
      },
      select: {
        id: true,
        name: true,
        level: true,
        maxlevel: true,
        class: true,
        race: true,
        spawnEntries: {
          npcID: true,
          spawnGroup: {
            id: true,
            spawns: { zone: true },
          },
        },
      },
      relations: { spawnEntries: { spawnGroup: { spawns: true } } },
    });

    npcRelevance.forEach((npc) => {
      const matchingResult = results.find((result) => result.id === npc.id);
      if (matchingResult) {
        matchingResult.relevance = npc.relevance;
      }
    });

    return results.filter((r) => r.relevance > 0);
  }

  searchFilter(search: string): FindOptionsWhere<Npc> {
    return search ? { searchable_name: Like(`%${search}%`) } : null;
  }

  raceFilter(races: number[]): FindOptionsWhere<Npc> {
    if (!races?.length) {
      return null;
    }
    console.log('adding race filter');
    return { race: In(races) };
  }

  classFilter(classes: number[]): FindOptionsWhere<Npc> {
    if (!classes?.length) {
      return null;
    }
    return { class: In(classes) };
  }

  bodyTypeFilter(bodyTypes: number[]): FindOptionsWhere<Npc> {
    if (!bodyTypes?.length) {
      return null;
    }
    return { bodytype: In(bodyTypes) };
  }

  seesInvisFilter(seesInvis?: boolean): FindOptionsWhere<Npc> {
    if (seesInvis === true) {
      return { see_invis: MoreThan(0) };
    } else if (seesInvis === false) {
      return { see_invis: LessThanOrEqual(0) };
    } else {
      return null;
    }
  }

  runspeedFilter(runspeeds: ComparableNumber[][]): FindOptionsWhere<Npc> {
    if (!runspeeds?.length) {
      return null;
    }

    const runspeedFilters = runspeeds.map((runspeed) =>
      And(...runspeed.map((comparison) => compareNumber(comparison))),
    );

    return { runspeed: Or(...runspeedFilters) };
  }

  zoneRawWhere(zones?: string[]): string {
    if (!zones?.length) {
      return null;
    }
    const zonesString = zones
      .filter(isAllowedZone)
      .map((zone) => `'${zone}'`)
      .join(', ');
    return `spawn.zone IN (${zonesString})`;
  }

  async complexSearch(options: NpcSearchOptions, loadAll = false) {
    const size = Math.min(options.size, 50);
    options.search = sanitizeSearch(options.search);

    // Build all the number comparison filters
    const numberFilters: FindOptionsWhere<Npc>[] = [
      {
        level: MoreThan(0),
      },
    ].filter(
      (filter) => filter && Object.keys(filter).some((key) => !!filter[key]),
    );
    // Combine individual number comparison filters into one
    const allNumberFilters = numberFilters.reduce(
      (all, filter) => ({ ...all, ...filter }),
      {} as FindOptionsWhere<Item>,
    );

    // Combine all the filters together
    const allFilters: FindOptionsWhere<Npc> = {
      ...allNumberFilters,
      ...this.searchFilter(options.search),
      ...this.raceFilter(options.races),
      ...this.classFilter(options.classes),
      ...this.bodyTypeFilter(options.bodyTypes),
      ...this.seesInvisFilter(options.seesInvis),
      ...this.runspeedFilter(options.runspeeds),
    };

    const order = options.sort.order === 1 ? 'ASC' : 'DESC';

    let query = this.npcRepository
      .createQueryBuilder('npc')
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
        'npc.searchable_name',
        'npc.id',
        'npc.level',
        'npc.maxlevel',
        'npc.class',
        'npc.race',
        'npc.bodytype',
        'npc.see_invis',
        'npc.runspeed',
        'spawn.zone',
        'spawn.enabled',
        'spawn.x',
        'spawn.y',
        'spawn.z',
        'spawn.id',
        'spawnEntry.chance',
        'spawn.min_expansion',
        'spawn.max_expansion',
        'spawn.respawntime',
        ...this.minimumSelections.spawns,
      ])
      .where(allFilters)
      .andWhere(`LENGTH(npc.searchable_name) > 1`)
      .andWhere('spawn.min_expansion <= 1')
      .orderBy(`npc.${options.sort.field}`, order)
      .skip(options.page * size)
      .take(size);

    // Zone filters
    const zonesWhere = this.zoneRawWhere(options.zones);
    if (zonesWhere) {
      query = query.andWhere(zonesWhere);
    }

    if (options.exactMatch === true) {
      query = query.andWhere(`npc.searchable_name = :search`, {
        search: options.search,
      });
    }

    // Level filters
    const minLevel = options.minLevel?.value;
    const maxLevel = options.maxLevel?.value;
    if (minLevel > 0) {
      query = query.andWhere(`npc.maxLevel >= :minLevel`, { minLevel });
    }
    if (maxLevel > 0) {
      query = query.andWhere(`npc.level <= :maxLevel`, { maxLevel });
    }

    if (!loadAll) {
      query = query.skip(options.page * size).take(size);
    }

    // Calculate respawntime
    const results = await query.getMany();
    results.forEach(
      (r) =>
        r.spawnEntries &&
        r.spawnEntries.forEach(
          (spawnEntry) =>
            spawnEntry.spawnGroup &&
            spawnEntry.spawnGroup.forEach(
              (group) =>
                group.spawns &&
                group.spawns.forEach(
                  (spawn) =>
                    (spawn.respawntime = this.respawnService.getRespawnTime(
                      spawn.zone,
                      spawn.respawntime,
                      r.level,
                    )),
                ),
            ),
        ),
    );

    return results;
  }

  async getById(npcId: number) {
    // Get the NPC
    const npc = await this.npcRepository.findOne({ where: { id: npcId } });

    if (!npc) {
      throw new NotFoundException(`NPC ${npcId} not found`);
    }

    // Get all the extra data from joins
    const [npcSpawns, npcLoot, npcMerchant, npcSpells] = await Promise.all([
      await this.getSpawns(npcId),
      await this.getLoot(npcId),
      await this.getMerchantItems(npcId),
      npc.npc_spells_id
        ? await this.spellService.getNpcSpells(
            npc.npc_spells_id,
            npc.level,
            npc.maxlevel,
          )
        : null,
    ]);
    // Mash it all together
    npc.spawnEntries = npcSpawns?.spawnEntries || [];
    npc.lootTable = npcLoot?.lootTable;
    npc.merchantEntries = npcMerchant?.merchantEntries;
    npc.spells = npcSpells;
    return npc;
  }

  public getSpawnEntries(spawnGroupIds: number[]) {
    if (!spawnGroupIds || !spawnGroupIds.length) {
      return [];
    }

    return this.spawnEntryRepository.find({
      where: {
        spawngroupID: In(spawnGroupIds),
        spawnGroup: { spawns: { min_expansion: LessThanOrEqual(1) } },
      },
      relations: { npc: true },
      select: {
        npc: {
          name: true,
          class: true,
          id: true,
          level: true,
          maxlevel: true,
          race: true,
        },
        spawnGroup: {
          id: true,
          spawns: {
            id: true,
            spawngroupID: true,
            min_expansion: true,
            max_expansion: true,
          },
        },
        npcID: true,
        spawngroupID: true,
        chance: true,
        mintime: true,
        maxtime: true,
      },
    });
  }

  private async getSpawns(npcId: number) {
    const result = await this.npcRepository
      .createQueryBuilder('npc')
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
      .where('npc.id = :npcId', { npcId })
      .andWhere('spawn.min_expansion <= 1')
      .select([
        'npc.name',
        'npc.level',
        'spawn.zone',
        'spawn.x',
        'spawn.y',
        'spawn.z',
        'spawn.id',
        'spawn.enabled',
        'spawnEntry.chance',
        'spawn.min_expansion',
        'spawn.max_expansion',
        'spawn.respawntime',
        ...this.minimumSelections.spawns,
      ])
      .getOne();
    result &&
      result.spawnEntries &&
      result.spawnEntries.forEach((spawnEntry) => {
        spawnEntry.spawnGroup &&
          spawnEntry.spawnGroup.forEach(
            (group) =>
              group.spawns &&
              group.spawns.forEach(
                (spawn) =>
                  (spawn.respawntime = this.respawnService.getRespawnTime(
                    spawn.zone,
                    spawn.respawntime,
                    result.level,
                  )),
              ),
          );
      });
    return result;
  }

  private getLoot(npcId: number) {
    return this.npcRepository
      .createQueryBuilder('npc')
      .leftJoinAndMapMany(
        'npc.lootTable',
        LootTable,
        'lootTable',
        'npc.loottable_id = lootTable.id',
      )
      .leftJoinAndMapMany(
        'lootTable.entries',
        LootTableEntry,
        'lootTableEntry',
        'lootTable.id = lootTableEntry.loottable_id',
      )
      .leftJoinAndMapMany(
        'lootTableEntry.lootDrop',
        LootDrop,
        'lootDrop',
        'lootTableEntry.lootdrop_id = lootDrop.id',
      )
      .leftJoinAndMapMany(
        'lootDrop.entries',
        LootDropEntry,
        'lootDropEntry',
        'lootDrop.id = lootDropEntry.lootdrop_id',
      )
      .leftJoinAndMapMany(
        'lootDropEntry.item',
        Item,
        'item',
        'lootDropEntry.item_id = item.id',
      )
      .where('npc.id = :npcId', { npcId })
      .select([
        'npc.name',
        'item.name',
        'item.icon',
        'item.price',
        'item.average7d',
        'item.average30d',
        'item.slots',
        'item.range',
        'lootDropEntry.chance',
        'lootDropEntry.multiplier',
        'lootTableEntry.probability',
        'lootTableEntry.multiplier',
        'lootTable.mincash',
        'lootTable.maxcash',
        'lootTable.avgcoin',
        ...this.minimumSelections.loot,
      ])
      .getOne();
  }

  private getMerchantItems(npcId: number) {
    return this.npcRepository
      .createQueryBuilder('npc')
      .leftJoinAndMapMany(
        'npc.merchantEntries',
        MerchantEntry,
        'merchantEntry',
        'npc.merchant_id = merchantEntry.merchantid',
      )
      .leftJoinAndMapMany(
        'merchantEntry.itemData',
        Item,
        'item',
        'merchantEntry.item = item.id',
      )
      .where('npc.id = :npcId', { npcId })
      .select([
        'item.name',
        'item.icon',
        'item.price',
        ...this.minimumSelections.merchant,
      ])
      .getOne();
  }
}
