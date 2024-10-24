import { Item } from '../items/item.entity';
import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';

@Entity({ name: 'spells_new', synchronize: false })
export class SpellNew {
  @PrimaryColumn() id: number;
  @Column() name: string;
  @Column() player_1: string;
  @Column() teleport_zone: string;
  @Column() you_cast: string;
  @Column() other_casts: string;
  @Column() cast_on_you: string;
  @Column() cast_on_other: string;
  @Column() spell_fades: string;
  @Column() range: number;
  @Column() aoerange: number;
  @Column('int', { select: false }) pushback: number;
  @Column('int', { select: false }) pushup: number;
  @Column() cast_time: number;
  @Column() recovery_time: number;
  @Column() recast_time: number;
  @Column() buffdurationformula: number;
  @Column() buffduration: number;
  @Column() AEDuration: number;
  @Column() mana: number;
  @Column() effect_base_value1: number;
  @Column() effect_base_value2: number;
  @Column() effect_base_value3: number;
  @Column() effect_base_value4: number;
  @Column() effect_base_value5: number;
  @Column() effect_base_value6: number;
  @Column() effect_base_value7: number;
  @Column() effect_base_value8: number;
  @Column() effect_base_value9: number;
  @Column() effect_base_value10: number;
  @Column() effect_base_value11: number;
  @Column() effect_base_value12: number;
  @Column() effect_limit_value1: number;
  @Column() effect_limit_value2: number;
  @Column() effect_limit_value3: number;
  @Column() effect_limit_value4: number;
  @Column() effect_limit_value5: number;
  @Column() effect_limit_value6: number;
  @Column() effect_limit_value7: number;
  @Column() effect_limit_value8: number;
  @Column() effect_limit_value9: number;
  @Column() effect_limit_value10: number;
  @Column() effect_limit_value11: number;
  @Column() effect_limit_value12: number;
  @Column() max1: number;
  @Column() max2: number;
  @Column() max3: number;
  @Column() max4: number;
  @Column() max5: number;
  @Column() max6: number;
  @Column() max7: number;
  @Column() max8: number;
  @Column() max9: number;
  @Column() max10: number;
  @Column() max11: number;
  @Column() max12: number;
  @Column() icon: number;
  @Column() memicon: number;
  @Column() components1: number;
  @Column() components2: number;
  @Column() components3: number;
  @Column() components4: number;
  @Column() component_counts1: number;
  @Column() component_counts2: number;
  @Column() component_counts3: number;
  @Column() component_counts4: number;
  @Column() NoexpendReagent1: number;
  @Column() NoexpendReagent2: number;
  @Column() NoexpendReagent3: number;
  @Column() NoexpendReagent4: number;
  @Column() formula1: number;
  @Column() formula2: number;
  @Column() formula3: number;
  @Column() formula4: number;
  @Column() formula5: number;
  @Column() formula6: number;
  @Column() formula7: number;
  @Column() formula8: number;
  @Column() formula9: number;
  @Column() formula10: number;
  @Column() formula11: number;
  @Column() formula12: number;
  @Column() LightType: number;
  @Column() goodEffect: number;
  @Column() Activated: number;
  @Column() resisttype: number;
  @Column() effectid1: number;
  @Column() effectid2: number;
  @Column() effectid3: number;
  @Column() effectid4: number;
  @Column() effectid5: number;
  @Column() effectid6: number;
  @Column() effectid7: number;
  @Column() effectid8: number;
  @Column() effectid9: number;
  @Column() effectid10: number;
  @Column() effectid11: number;
  @Column() effectid12: number;
  @Column() targettype: number;
  @Column() basediff: number;
  @Column() skill: number;
  @Column() zonetype: number;
  @Column() EnvironmentType: number;
  @Column() TimeOfDay: number;
  @Column() classes1: number;
  @Column() classes2: number;
  @Column() classes3: number;
  @Column() classes4: number;
  @Column() classes5: number;
  @Column() classes6: number;
  @Column() classes7: number;
  @Column() classes8: number;
  @Column() classes9: number;
  @Column() classes10: number;
  @Column() classes11: number;
  @Column() classes12: number;
  @Column() classes13: number;
  @Column() classes14: number;
  @Column() classes15: number;
  @Column() CastingAnim: number;
  @Column() TargetAnim: number;
  @Column() TravelType: number;
  @Column() SpellAffectIndex: number;
  @Column() disallow_sit: number;
  @Column() deities0: number;
  @Column() deities1: number;
  @Column() deities2: number;
  @Column() deities3: number;
  @Column() deities4: number;
  @Column() deities5: number;
  @Column() deities6: number;
  @Column() deities7: number;
  @Column() deities8: number;
  @Column() deities9: number;
  @Column() deities10: number;
  @Column() deities11: number;
  @Column() deities12: number;
  @Column() deities13: number;
  @Column() deities14: number;
  @Column() deities15: number;
  @Column() deities16: number;
  @Column() npc_no_cast: number;
  @Column() ai_pt_bonus: number;
  @Column() new_icon: number;
  @Column() spellanim: number;
  @Column() uninterruptable: number;
  @Column() ResistDiff: number;
  @Column() dot_stacking_exempt: number;
  @Column() deleteable: number;
  @Column() RecourseLink: number;
  @Column() no_partial_resist: number;
  @Column() small_targets_only: number;
  @Column() use_persistent_particles: number;
  @Column() short_buff_box: number;
  @Column() descnum: number;
  @Column() typedescnum: number;
  @Column() effectdescnum: number;
  @Column() effectdescnum2: number;
  @Column() npc_no_los: number;
  @Column() reflectable: number;
  @Column() resist_per_level: number;
  @Column() resist_cap: number;
  @Column() EndurCost: number;
  @Column() EndurTimerIndex: number;
  @Column() IsDiscipline: number;
  @Column() HateAdded: number;
  @Column() EndurUpkeep: number;
  @Column() pvpresistbase: number;
  @Column() pvpresistcalc: number;
  @Column() pvpresistcap: number;
  @Column() spell_category: number;
  @Column() pvp_duration: number;
  @Column() pvp_duration_cap: number;
  @Column() cast_not_standing: number;
  @Column() can_mgb: number;
  @Column() nodispell: number;
  @Column() npc_category: number;
  @Column() npc_usefulness: number;
  @Column() wear_off_message: number;
  @Column() suspendable: number;
  @Column() spellgroup: number;
  @Column() allow_spellscribe: number;
  @Column() allowrest: number;
  @Column() custom_icon: number;
  @Column() not_player_spell: number;
  @Column() disabled: number;

  @Column() searchable_name: string;

  @Column('int', { select: false }) relevance: number;

  @OneToMany(() => Item, (item) => item.clickEffect)
  @JoinColumn({ name: 'id', referencedColumnName: 'clickeffect' })
  clickItems: Item[];

  @OneToMany(() => Item, (item) => item.procEffect)
  @JoinColumn({ name: 'id', referencedColumnName: 'proceffect' })
  procItems: Item[];

  @OneToMany(() => Item, (item) => item.scrollEffect)
  @JoinColumn({ name: 'id', referencedColumnName: 'scrolleffect' })
  scrollItems: Item[];

  @OneToMany(() => Item, (item) => item.wornEffect)
  @JoinColumn({ name: 'id', referencedColumnName: 'worneffect' })
  wornItems: Item[];

  summonedItems?: Item[];
  components?: SpellComponent[];
}

export interface SpellComponent {
  itemId: number;
  item?: Item;
  counts: number;
  isExpended: boolean;
}
