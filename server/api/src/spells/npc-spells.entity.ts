import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { SpellNew } from './spell-new.entity';

@Entity({ name: 'npc_spells', synchronize: false })
export class NpcSpells {
  @PrimaryColumn() id: number;
  @Column() name: string;
  @Column() attack_proc: number;
  @Column() proc_chance: number;
  @Column() parent_list: number;

  @ManyToOne(() => SpellNew, (spellNew) => spellNew.attackProcs)
  @JoinColumn({ name: 'attack_proc', referencedColumnName: 'id' })
  attackProc: SpellNew;

  @ManyToOne(() => NpcSpells, (npcSpells) => npcSpells.childLists)
  @JoinColumn({ name: 'parent_list', referencedColumnName: 'id' })
  parentList: NpcSpells;

  @OneToMany(() => NpcSpells, (npcSpells) => npcSpells.parentList)
  @JoinColumn({ name: 'id', referencedColumnName: 'parent_list' })
  childLists: NpcSpells[];

  @OneToMany(() => NpcSpellsEntry, (npcSpellEntry) => npcSpellEntry.npcSpells)
  @JoinColumn({ name: 'id', referencedColumnName: 'npc_spells_id' })
  npcSpellEntries: NpcSpellsEntry[];
}

@Entity({ name: 'npc_spells_entries', synchronize: false })
export class NpcSpellsEntry {
  @PrimaryColumn() id: number;
  @Column() npc_spells_id: number;
  @Column() spellid: number;
  @Column() minlevel: number;
  @Column() maxlevel: number;

  @ManyToOne(() => NpcSpells, (npcSpells) => npcSpells.npcSpellEntries)
  @JoinColumn({ name: 'npc_spells_id', referencedColumnName: 'id' })
  npcSpells: NpcSpells;

  @ManyToOne(() => SpellNew, (spellNew) => spellNew.npcSpellEntries)
  @JoinColumn({ name: 'spellid', referencedColumnName: 'id' })
  spellNew: SpellNew;
}
