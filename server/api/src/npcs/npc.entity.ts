import { Item, LootTable } from '../items/item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SpellNew } from '../spells/spell-new.entity';

@Entity({ name: 'npc_types', synchronize: false })
export class Npc {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() lastname: string;
  @Column() level: number;
  @Column() race: number;
  @Column() class: number;
  @Column() bodytype: number;
  @Column() hp: number;
  @Column() mana: number;
  @Column() gender: number;
  @Column() texture: number;
  @Column() helmtexture: number;
  @Column() size: number;
  @Column() hp_regen_rate: number;
  @Column() mana_regen_rate: number;
  @Column() loottable_id: number;
  @Column() merchant_id: number;
  @Column() npc_spells_id: number;
  @Column() npc_spells_effects_id: number;
  @Column() npc_faction_id: number;
  @Column() mindmg: number;
  @Column() maxdmg: number;
  @Column() attack_count: number;
  @Column() special_abilities: string;
  @Column() aggroradius: number;
  @Column() assistradius: number;
  @Column() prim_melee_type: number;
  @Column() sec_melee_type: number;
  @Column() ranged_type: number;
  @Column('decimal', { precision: 6, scale: 2 }) runspeed: number;
  @Column() MR: number;
  @Column() CR: number;
  @Column() DR: number;
  @Column() FR: number;
  @Column() PR: number;
  @Column() see_invis: number;
  @Column() see_invis_undead: number;
  @Column() qglobal: number;
  @Column() AC: number;
  @Column() npc_aggro: number;
  @Column() spawn_limit: number;
  @Column() attack_delay: number;
  @Column() STR: number;
  @Column() STA: number;
  @Column() DEX: number;
  @Column() AGI: number;
  @Column() _INT: number;
  @Column() WIS: number;
  @Column() CHA: number;
  @Column() see_sneak: number;
  @Column() see_improved_hide: number;
  @Column() ATK: number;
  @Column() Accuracy: number;
  @Column() slow_mitigation: number;
  @Column() maxlevel: number;
  @Column() scalerate: number;
  @Column() private_corpse: number;
  @Column() unique_spawn_by_name: number;
  @Column() underwater: number;
  @Column() isquest: number;
  @Column() emoteid: number;
  @Column() spellscale: number;
  @Column() healscale: number;
  @Column() raid_target: number;
  @Column() light: number;
  @Column('decimal', { precision: 6, scale: 2 }) walkspeed: number;
  @Column() combat_hp_regen: number;
  @Column() combat_mana_regen: number;
  @Column() aggro_pc: number;
  @Column() ignore_distance: number;
  @Column() avoidance: number;
  @Column() exp_pct: number;
  @Column() greed: number;
  @Column() engage_notice: number;
  @Column() stuck_behavior: number;
  @Column() flymode: number;
  @Column() loot_lockout: number;

  @Column() searchable_name: string;

  @Column('int', { select: false })
  relevance: number;

  @OneToMany(() => LootTable, (lootTable) => lootTable.npcs)
  @JoinColumn({ name: 'loottable_id', referencedColumnName: 'id' })
  lootTable: LootTable[];

  @OneToMany(() => SpawnEntry, (entry) => entry.npc)
  @JoinColumn({ name: 'id', referencedColumnName: 'npcID' })
  spawnEntries: SpawnEntry[];

  @ManyToMany(() => MerchantEntry, (merchantEntry) => merchantEntry.npcs)
  @JoinColumn({ name: 'merchant_id', referencedColumnName: 'merchantid' })
  merchantEntries: MerchantEntry[];

  spells?: {
    procs: { procChance: number; spellId: number; spell?: SpellNew }[];
    casts: SpellNew[];
  };
}

@Entity({ name: 'merchantlist', synchronize: false })
export class MerchantEntry {
  @PrimaryGeneratedColumn() id: number;
  @Column() merchantid: number;
  @Column() slot: number;
  @Column() item: number;
  @Column() faction_required: number;
  @Column() level_required: number;
  @Column() alt_currency_cost: number;
  @Column() classes_required: number;
  @Column() probability: number;
  @Column() quantity: number;
  @Column() min_expansion: number;
  @Column() max_expansion: number;

  @ManyToMany(() => Npc, (npc) => npc.merchantEntries)
  @JoinColumn({ name: 'merchantid', referencedColumnName: 'merchant_id' })
  npcs: Npc[];

  @ManyToOne(() => Item, (item) => item.merchantEntries)
  @JoinColumn({ name: 'item', referencedColumnName: 'id' })
  itemData: Item;
}

@Entity({ name: 'spawngroup', synchronize: false })
export class SpawnGroup {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() spawn_limit: number;
  @Column() max_x: number;
  @Column() max_y: number;
  @Column() min_x: number;
  @Column() min_y: number;
  @Column() delay: number;
  @Column() mindelay: number;
  @Column() despawn: number;
  @Column() despawn_timer: number;
  @Column() rand_spawns: number;
  @Column() rand_respawntime: number;
  @Column() rand_variance: number;
  @Column() wp_spawns: number;

  @OneToMany(() => SpawnEntry, (entry) => entry.spawnGroup)
  @JoinColumn({ name: 'id', referencedColumnName: 'spawngroupID' })
  entries: SpawnEntry[];

  @OneToMany(() => Spawn, (spawn) => spawn.spawnGroup)
  @JoinColumn({ name: 'id', referencedColumnName: 'spawngroupID' })
  spawns: Spawn[];
}

@Entity({ name: 'spawnentry', synchronize: false })
export class SpawnEntry {
  @PrimaryGeneratedColumn() id: number;
  @Column() spawngroupID: number;
  @Column() npcID: number;
  @Column() chance: number;
  @Column() mintime: number;
  @Column() maxtime: number;
  @Column() min_expansion: boolean;
  @Column() max_expansion: boolean;

  @ManyToOne(() => Npc, (npc) => npc.spawnEntries)
  @JoinColumn({ name: 'npcID', referencedColumnName: 'id' })
  npc: Npc;

  @ManyToOne(() => SpawnGroup, (group) => group.entries)
  @JoinColumn({ name: 'spawngroupID', referencedColumnName: 'id' })
  spawnGroup: [SpawnGroup];
}

@Entity({ name: 'spawn2', synchronize: false })
export class Spawn {
  @PrimaryGeneratedColumn() id: number;
  @Column() spawngroupID: number;
  @Column() zone: string;
  @Column() x: number;
  @Column() y: number;
  @Column() z: number;
  @Column() heading: number;
  @Column() respawntime: number;
  @Column() variance: number;
  @Column() pathgrid: number;
  @Column() _condition: number;
  @Column() cond_value: number;
  @Column() enabled: number;
  @Column() animation: number;
  @Column() boot_respawntime: number;
  @Column() clear_timer_onboot: number;
  @Column() boot_variance: number;
  @Column() force_z: number;
  @Column() min_expansion: number;
  @Column() max_expansion: number;
  @Column() raid_target_spawnpoint: number;

  @ManyToOne(() => SpawnGroup, (group) => group.entries)
  @JoinColumn({ name: 'spawngroupID', referencedColumnName: 'id' })
  spawnGroup: SpawnGroup;
}
