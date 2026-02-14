import { NumberFormatStyle } from '@angular/common';
import { MerchantEntry, Npc, Spawn } from '../npcs/npc.entity';
import * as _ from 'lodash';
import { SpellNew } from '../spells/spell.entity';
import { Log } from '../logs/log.entity';

export interface Item {
  id: number;
  minstatus: number;
  name: string;
  aagi: number;
  ac: number;
  acha: number;
  adex: number;
  aint: number;
  astr: number;
  asta: number;
  awis: number;
  bagsize: number;
  bagslots: number;
  bagtype: number;
  bagwr: number;
  banedmgamt: number;
  banedmgbody: number;
  banedmgrace: number;
  bardtype: number;
  bardvalue: number;
  book: number;
  casttime: number;
  casttime_: number;
  classes: number;
  color: number;
  price: number;
  cr: number;
  damage: number;
  deity: number;
  delay: number;
  dr: number;
  clicktype: number;
  clicklevel2: number;
  elemdmgtype: number;
  factionamt1: number;
  factionamt2: number;
  factionamt3: number;
  factionamt4: number;
  factionmod1: number;
  factionmod2: number;
  factionmod3: number;
  factionmod4: number;
  filename: string;
  focuseffect: number;
  fr: number;
  fvnodrop: number;
  clicklevel: number;
  hp: number;
  icon: number;
  idfile: string;
  itemclass: number;
  itemtype: number;
  light: number;
  lore: string;
  magic: number;
  mana: number;
  material: number;
  maxcharges: number;
  mr: number;
  nodrop: number;
  norent: number;
  pr: number;
  procrate: number;
  races: number;
  range: number;
  reqlevel: number;
  reclevel: number;
  recskill: number;
  sellrate: number;
  size: number;
  skillmodtype: number;
  skillmodvalue: number;
  slots: number;
  clickeffect: number;
  tradeskills: number;
  weight: number;
  booktype: number;
  recastdelay: number;
  updated: Date;
  comment: string;
  stacksize: number;
  stackable: number;
  proceffect: number;
  proctype: number;
  proclevel2: number;
  proclevel: number;
  worneffect: number;
  worntype: number;
  wornlevel2: number;
  wornlevel: number;
  focustype: number;
  focuslevel2: number;
  focuslevel: number;
  scrolleffect: number;
  scrolllevel2: number;
  scrolllevel: number;
  serialized: Date;
  verified: Date;
  serialization: string;
  source: string;
  lorefile: string;
  questitemflag: number;
  clickunk5: number;
  clickunk6: number;
  clickunk7: number;
  procunk1: number;
  procunk2: number;
  procunk3: number;
  procunk4: number;
  procunk6: number;
  procunk7: number;
  wornunk1: number;
  wornunk2: number;
  wornunk3: number;
  wornunk4: number;
  wornunk5: number;
  wornunk6: number;
  wornunk7: number;
  scrollunk1: number;
  scrollunk2: number;
  scrollunk3: number;
  scrollunk4: number;
  scrollunk5: number;
  scrollunk6: number;
  scrollunk7: number;
  clickname: string;
  procname: string;
  wornname: string;
  focusname: string;
  scrollname: string;
  created: string;
  bardeffect: number;
  bardeffecttype: number;
  bardlevel2: number;
  bardlevel: number;
  bardunk1: number;
  bardunk2: number;
  bardunk3: number;
  bardunk4: number;
  bardunk5: number;
  bardname: string;
  bardunk7: number;
  gmflag: number;
  soulbound: number;
  min_expansion: number;
  max_expansion: number;
  legacy_item: number;
  relevance: number;

  lootDropEntries: LootDropEntry[];
  merchantEntries: MerchantEntry[];

  clickEffect?: SpellNew;
  wornEffect?: SpellNew;
  procEffect?: SpellNew;
  scrollEffect?: SpellNew;
  focusEffect?: SpellNew;

  average7d?: number;
  average30d?: number;

  dailyAuctions?: DailyAuction[];
  auctionSummaries?: AuctionSummary[];
}

export interface LootTable {
  id: number;
  name: string;
  mincash: number;
  maxcash: number;
  avgcoin: number;
  done: boolean;

  npcs: Npc[];
  entries: LootTableEntry[];
}

export interface LootDrop {
  id: number;
  name: number;

  entries: LootDropEntry[];
  lootTableEntries: LootTableEntry[];
}

export interface LootTableEntry {
  loottable_id: number;
  lootdrop_id: number;
  multiplier: number;
  probability: number;
  droplimit: number;
  mindrop: number;
  multiplier_min: number;

  lootTable: LootTable[];
  lootDrop: LootDrop[];
}

export interface LootDropEntry {
  lootdrop_id: number;
  item_id: number;
  item_charges: number;
  equip_item: boolean;
  chance: number;
  minlevel: number;
  maxlevel: number;
  multiplier: number;
  disabled_chance: number;
  min_expansion: number;
  max_expansion: number;
  min_looter_level: number;

  lootDrop: [LootDrop];
  item: [Item];
}

export interface NpcSpawns {
  npcId: number;
  npcName: string;
  zone: string;
  spawns: Spawn[];
}

export function getDropRate(
  lootTableEntry: LootTableEntry,
  lootDropEntry: LootDropEntry
) {
  const chancePerCount =
    (lootTableEntry.probability / 100 || 1) * (lootDropEntry.chance / 100);
  const maxCount =
    (lootTableEntry.multiplier || 1) * (lootDropEntry.multiplier || 1);
  const avgCount = chancePerCount * maxCount;
  return {
    chancePerCount,
    maxCount,
    avgCount,
  };
}

export interface DropsFrom {
  npcId: number;
  npcName: string;
  zone: string;
  spawns: Spawn[];
  chancePerCount: number;
  maxCount: number;
  avgCount: number;
}

export function dropsFrom(item: Item): DropsFrom[] {
  return _.flattenDeep(
    item.lootDropEntries.map((lootDropEntry) =>
      lootDropEntry.lootDrop.map((lootDrop) =>
        lootDrop.lootTableEntries.map((lootTableEntry) =>
          lootTableEntry.lootTable.map((lootTable) =>
            lootTable.npcs.map((npc) => {
              const dropRate = getDropRate(lootTableEntry, lootDropEntry);
              const spawns = _.flattenDeep(
                npc.spawnEntries.map((spawnEntry) =>
                  spawnEntry.spawnGroup.map((spawnGroup) => spawnGroup.spawns)
                )
              );
              const zones = spawns.map((spawn) => spawn.zone);
              return {
                npcId: npc.id,
                npcName: npc.name,
                level: npc.level,
                maxlevel: npc.maxlevel,
                zone: zones[0] || 'Unknown',
                spawns,
                ...dropRate,
              };
            })
          )
        )
      )
    )
  );
}

export function soldBy(item: Item): NpcSpawns[] {
  return _.flattenDeep(
    item.merchantEntries.map((merchantEntry) =>
      merchantEntry.npcs.map((npc) => {
        const spawns = _.flattenDeep(
          npc.spawnEntries.map((spawnEntry) =>
            spawnEntry.spawnGroup.map((spawnGroup) => spawnGroup.spawns)
          )
        );
        const zones = spawns.map((spawn) => spawn.zone);
        return {
          npcId: npc.id,
          npcName: npc.name,
          zone: zones[0] || 'Unknown',
          spawns,
        };
      })
    )
  );
}

// Effect proceffect, worneffect, scrolleffect, and also clicktype,
// clicklevel, clickeffect => spells_new, casttime? recastdelay recasttype clickname?
// TODO:  this probably needs to be a component, since there's links to the effects, and probably a popover detail view for the effects.
// this is good to check I'm showing the right info tho.
export function buildEffects(item: Item) {
  const {
    casttime,
    procEffect,
    proclevel,
    wornEffect,
    wornlevel,
    focusEffect,
    focuslevel,
    scrollEffect,
    scrolllevel,
    clickEffect,
    clicklevel,
    clicktype,
  } = item;

  const buildEffect = (spell: SpellNew, level: number, type = '') => {
    const castTime = casttime <= 0 ? 'Instant' : Math.round(casttime / 100);
    const minLevel = level > 1 ? `Requires level ${level}. ` : '';
    return `Effect: ${spell.name} (${type}${minLevel}Casting Time: ${castTime})`;
  };

  const effects: string[] = [];

  if (clickEffect) {
    const clickType = clicktype === 4 ? 'Must Equip. ' : '';
    effects.push(buildEffect(clickEffect, clicklevel, clickType));
  }

  if (procEffect) {
    effects.push(buildEffect(procEffect, proclevel));
  }

  if (wornEffect) {
    effects.push(buildEffect(wornEffect, wornlevel));
  }

  if (focusEffect) {
    effects.push(buildEffect(focusEffect, focuslevel));
  }

  if (scrollEffect) {
    effects.push(buildEffect(scrollEffect, scrolllevel));
  }

  return effects;
}

interface DailyAuction {
  log: Log;
  player: string;
  sentAt: string;
  price: number;
  wts: boolean;
}

interface AuctionSummary {
  date: string;
  min: number;
  max: number;
  average: number;
  count: number;
  wts: boolean;
}