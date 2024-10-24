import { MerchantEntry, Npc } from '../npcs/npc.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { SpellNew } from '../spells/spell-new.entity';

@Entity({ name: 'items', synchronize: false })
export class Item {
  @PrimaryColumn() id: number;
  @Column() minstatus: number;
  @Column() name: string;
  @Column() aagi: number;
  @Column() ac: number;
  @Column() acha: number;
  @Column() adex: number;
  @Column() aint: number;
  @Column() astr: number;
  @Column() asta: number;
  @Column() awis: number;
  @Column() bagsize: number;
  @Column() bagslots: number;
  @Column() bagtype: number;
  @Column() bagwr: number;
  @Column() banedmgamt: number;
  @Column() banedmgbody: number;
  @Column() banedmgrace: number;
  @Column() bardtype: number;
  @Column() bardvalue: number;
  @Column() book: number;
  @Column() casttime: number;
  @Column() casttime_: number;
  @Column() classes: number;
  @Column() color: number;
  @Column() price: number;
  @Column() cr: number;
  @Column() damage: number;
  @Column() deity: number;
  @Column() delay: number;
  @Column() dr: number;
  @Column() clicktype: number;
  @Column() clicklevel2: number;
  @Column() elemdmgtype: number;
  @Column() factionamt1: number;
  @Column() factionamt2: number;
  @Column() factionamt3: number;
  @Column() factionamt4: number;
  @Column() factionmod1: number;
  @Column() factionmod2: number;
  @Column() factionmod3: number;
  @Column() factionmod4: number;
  @Column() filename: string;
  @Column() focuseffect: number;
  @Column() fr: number;
  @Column() fvnodrop: number;
  @Column() clicklevel: number;
  @Column() hp: number;
  @Column() icon: number;
  @Column() idfile: string;
  @Column() itemclass: number;
  @Column() itemtype: number;
  @Column() light: number;
  @Column() lore: string;
  @Column() magic: number;
  @Column() mana: number;
  @Column() material: number;
  @Column() maxcharges: number;
  @Column() mr: number;
  @Column() nodrop: number;
  @Column() norent: number;
  @Column() pr: number;
  @Column() procrate: number;
  @Column() races: number;
  @Column() range: number;
  @Column() reqlevel: number;
  @Column() reclevel: number;
  @Column() recskill: number;
  @Column('int', { select: false }) sellrate: number;
  @Column() size: number;
  @Column() skillmodtype: number;
  @Column() skillmodvalue: number;
  @Column() slots: number;
  @Column() clickeffect: number;
  @Column() tradeskills: number;
  @Column() weight: number;
  @Column() booktype: number;
  @Column() recastdelay: number;
  @Column() updated: Date;
  @Column() comment: string;
  @Column() stacksize: number;
  @Column() stackable: number;
  @Column() proceffect: number;
  @Column() proctype: number;
  @Column() proclevel2: number;
  @Column() proclevel: number;
  @Column() worneffect: number;
  @Column() worntype: number;
  @Column() wornlevel2: number;
  @Column() wornlevel: number;
  @Column() focustype: number;
  @Column() focuslevel2: number;
  @Column() focuslevel: number;
  @Column() scrolleffect: number;
  @Column() scrolllevel2: number;
  @Column() scrolllevel: number;
  @Column() serialized: Date;
  @Column() verified: Date;
  @Column() serialization: string;
  @Column() source: string;
  @Column() lorefile: string;
  @Column() questitemflag: number;
  @Column() clickunk5: number;
  @Column() clickunk6: number;
  @Column() clickunk7: number;
  @Column() procunk1: number;
  @Column() procunk2: number;
  @Column() procunk3: number;
  @Column() procunk4: number;
  @Column() procunk6: number;
  @Column() procunk7: number;
  @Column() wornunk1: number;
  @Column() wornunk2: number;
  @Column() wornunk3: number;
  @Column() wornunk4: number;
  @Column() wornunk5: number;
  @Column() wornunk6: number;
  @Column() wornunk7: number;
  @Column() scrollunk1: number;
  @Column() scrollunk2: number;
  @Column() scrollunk3: number;
  @Column() scrollunk4: number;
  @Column() scrollunk5: number;
  @Column() scrollunk6: number;
  @Column() scrollunk7: number;
  @Column() clickname: string;
  @Column() procname: string;
  @Column() wornname: string;
  @Column() focusname: string;
  @Column() scrollname: string;
  @Column() created: string;
  @Column() bardeffect: number;
  @Column() bardeffecttype: number;
  @Column() bardlevel2: number;
  @Column() bardlevel: number;
  @Column() bardunk1: number;
  @Column() bardunk2: number;
  @Column() bardunk3: number;
  @Column() bardunk4: number;
  @Column() bardunk5: number;
  @Column() bardname: string;
  @Column() bardunk7: number;
  @Column() gmflag: number;
  @Column() soulbound: number;
  @Column() min_expansion: number;
  @Column() max_expansion: number;
  @Column() legacy_item: number;
  @Column() searchable_name: string;

  @Column('int', { select: false })
  relevance: number;

  @OneToMany(() => LootDropEntry, (lootDrop) => lootDrop.item)
  @JoinColumn({ name: 'id', referencedColumnName: 'item_id' })
  lootDropEntries: LootDropEntry[];

  @OneToMany(() => MerchantEntry, (merchantEntry) => merchantEntry.itemData)
  @JoinColumn({ name: 'id', referencedColumnName: 'item' })
  merchantEntries: MerchantEntry[];

  @ManyToOne(() => SpellNew, (spell) => spell.clickItems)
  @JoinColumn({ name: 'clickeffect', referencedColumnName: 'id' })
  clickEffect: SpellNew;

  @ManyToOne(() => SpellNew, (spell) => spell.procItems)
  @JoinColumn({ name: 'proceffect', referencedColumnName: 'id' })
  procEffect: SpellNew;

  @ManyToOne(() => SpellNew, (spell) => spell.scrollItems)
  @JoinColumn({ name: 'scrolleffect', referencedColumnName: 'id' })
  scrollEffect: SpellNew;

  @ManyToOne(() => SpellNew, (spell) => spell.wornItems)
  @JoinColumn({ name: 'worneffect', referencedColumnName: 'id' })
  wornEffect: SpellNew;

  @Column({ nullable: true })
  average7d: number;

  @Column({ nullable: true })
  average30d: number;
}

@Entity({ name: 'loottable', synchronize: false })
export class LootTable {
  @PrimaryColumn() id: number;
  @Column() name: string;
  @Column() mincash: number;
  @Column() maxcash: number;
  @Column() avgcoin: number;
  @Column() done: boolean;

  @OneToMany(() => Npc, (npc) => npc.lootTable)
  @JoinColumn({ name: 'id', referencedColumnName: 'loottable_id' })
  npcs: Npc[];

  @OneToMany(() => LootTableEntry, (entry) => entry.lootTable)
  @JoinColumn({ name: 'id', referencedColumnName: 'loottable_id' })
  entries: LootTableEntry[];
}

@Entity({ name: 'lootdrop', synchronize: false })
export class LootDrop {
  @PrimaryColumn() id: number;
  @Column() name: number;

  @OneToMany(() => LootDropEntry, (entry) => entry.lootDrop)
  @JoinColumn({ name: 'id', referencedColumnName: 'lootdrop_id' })
  entries: LootDropEntry[];

  @OneToMany(() => LootTableEntry, (entry) => entry.lootDrop)
  @JoinColumn({ name: 'id', referencedColumnName: 'lootdrop_id' })
  lootTableEntries: LootTableEntry[];
}

@Entity({ name: 'loottable_entries', synchronize: false })
export class LootTableEntry {
  @PrimaryColumn() loottable_id: number;
  @PrimaryColumn() lootdrop_id: number;
  @Column() multiplier: number;
  @Column() probability: number;
  @Column() droplimit: number;
  @Column() mindrop: number;
  @Column() multiplier_min: number;

  @ManyToOne(() => LootTable, (lootTable) => lootTable.entries)
  @JoinColumn({ name: 'loottable_id', referencedColumnName: 'id' })
  lootTable: LootTable;

  @ManyToOne(() => LootDrop)
  @JoinColumn({ name: 'lootdrop_id', referencedColumnName: 'id' })
  lootDrop: LootDrop[];
}

@Entity({ name: 'lootdrop_entries', synchronize: false })
export class LootDropEntry {
  @PrimaryColumn() lootdrop_id: number;
  @PrimaryColumn() item_id: number;
  @Column() item_charges: number;
  @Column() equip_item: boolean;
  @Column('decimal', { precision: 7, scale: 4 }) chance: number;
  @Column() minlevel: number;
  @Column() maxlevel: number;
  @Column() multiplier: number;
  @Column() disabled_chance: number;
  @Column() min_expansion: number;
  @Column() max_expansion: number;
  @Column() min_looter_level: number;

  @ManyToOne(() => LootDrop, (lootDrop) => lootDrop.entries)
  @JoinColumn({ name: 'lootdrop_id', referencedColumnName: 'id' })
  lootDrop: LootDrop;

  @OneToMany(() => Item, (item) => item.lootDropEntries)
  @JoinColumn({ name: 'item_id', referencedColumnName: 'id' })
  item: Item[];
}
