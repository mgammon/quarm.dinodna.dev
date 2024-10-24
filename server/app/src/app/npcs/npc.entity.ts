import { Item, LootTable, getDropRate } from '../items/item.entity';
import * as _ from 'lodash';

export interface Npc {
  id: number;
  name: string;
  lastname: string;
  level: number;
  race: number;
  class: number;
  bodytype: number;
  hp: number;
  mana: number;
  gender: number;
  texture: number;
  helmtexture: number;
  size: number;
  hp_regen_rate: number;
  mana_regen_rate: number;
  loottable_id: number;
  merchant_id: number;
  npc_spells_id: number;
  npc_spells_effects_id: number;
  npc_faction_id: number;
  mindmg: number;
  maxdmg: number;
  attack_count: number;
  special_abilities: string;
  aggroradius: number;
  assistradius: number;
  prim_melee_type: number;
  sec_melee_type: number;
  ranged_type: number;
  runspeed: number;
  MR: number;
  CR: number;
  DR: number;
  FR: number;
  PR: number;
  see_invis: number;
  see_invis_undead: number;
  qglobal: number;
  AC: number;
  npc_aggro: number;
  spawn_limit: number;
  attack_delay: number;
  STR: number;
  STA: number;
  DEX: number;
  AGI: number;
  _INT: number;
  WIS: number;
  CHA: number;
  see_sneak: number;
  see_improved_hide: number;
  ATK: number;
  Accuracy: number;
  slow_mitigation: number;
  maxlevel: number;
  scalerate: number;
  private_corpse: number;
  unique_spawn_by_name: number;
  underwater: number;
  isquest: number;
  emoteid: number;
  spellscale: number;
  healscale: number;
  raid_target: number;
  light: number;
  walkspeed: number;
  combat_hp_regen: number;
  combat_mana_regen: number;
  aggro_pc: number;
  ignore_distance: number;
  avoidance: number;
  exp_pct: number;
  greed: number;
  engage_notice: number;
  stuck_behavior: number;
  flymode: number;
  loot_lockout: number;
  relevance: number;

  lootTable: LootTable[];
  spawnEntries: SpawnEntry[];
  merchantEntries: MerchantEntry[];

  zones?: string[];
  spawns: { zoneId: string; zoneName: string; spawns: Spawn[] }[];
}

export interface MerchantEntry {
  id: number;
  merchantid: number;
  slot: number;
  item: number;
  faction_required: number;
  level_required: number;
  alt_currency_cost: number;
  classes_required: number;
  probability: number;
  quantity: number;
  min_expansion: number;
  max_expansion: number;

  npcs: Npc[];
  itemData: Item;
}

export interface SpawnGroup {
  id: number;
  name: string;
  spawn_limit: number;
  max_x: number;
  max_y: number;
  min_x: number;
  min_y: number;
  delay: number;
  mindelay: number;
  despawn: number;
  despawn_timer: number;
  rand_spawns: number;
  rand_respawntime: number;
  rand_variance: number;
  wp_spawns: number;

  entries: SpawnEntry[];
  spawns: Spawn[];
}

export interface SpawnEntry {
  id: number;
  spawngroupID: number;
  npcID: number;
  chance: number;
  mintime: number;
  maxtime: number;

  npc: Npc;
  spawnGroup: [SpawnGroup];
}

export interface Spawn {
  id: number;
  spawngroupID: number;
  zone: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  respawntime: number;
  variance: number;
  pathgrid: number;
  _condition: number;
  cond_value: number;
  enabled: number;
  animation: number;
  boot_respawntime: number;
  clear_timer_onboot: number;
  boot_variance: number;
  force_z: number;
  min_expansion: number;
  max_expansion: number;
  raid_target_spawnpoint: number;

  spawnGroup: SpawnGroup;
}

export function drops(npc: Npc) {
  return _.flattenDeep(
    npc.lootTable.map((lootTable) =>
      lootTable.entries.map((lootTableEntry) =>
        lootTableEntry.lootDrop.map((lootDrop) =>
          lootDrop.entries.map((lootDropEntry) =>
            lootDropEntry.item.map((item) => {
              const dropRate = getDropRate(lootTableEntry, lootDropEntry);
              const { id, icon, name } = item;
              return {
                ...dropRate,
                id,
                icon,
                name,
                price: item.price,
                average7d: item.average7d,
                average30d: item.average30d,
              };
            })
          )
        )
      )
    )
  );
}

export function sells(npc: Npc) {
  return _.flattenDeep(
    npc.merchantEntries.map((merchantEntry) => merchantEntry.itemData)
  );
}
