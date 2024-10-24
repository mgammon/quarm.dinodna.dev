import { Npc } from '../npcs/npc.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'zone', synchronize: false })
export class Zone {
  @PrimaryColumn() id: number;
  @Column() short_name: string;
  @Column() file_name: string;
  @Column() long_name: string;
  @Column() safe_x: number;
  @Column() safe_y: number;
  @Column() safe_z: number;
  @Column() min_level: number;
  @Column() graveyard_id: number;
  @Column() zoneidnumber: number;
  @Column('int') zone_exp_multiplier: number;
  @Column() canbind: number;
  @Column() cancombat: number;
  @Column() canlevitate: number;
  @Column() castoutdoor: number;
  @Column() hotzone: number;
  @Column() expansion: number;
  @Column() castdungeon: number;
  @Column() pull_limit: number;
  @Column() graveyard_time: number;
  @Column() reducedspawntimers: number;
  @Column() trivial_loot_code: number;

  @Column('int', { select: false })
  relevance?: number;

  npcs?: Npc[];
}
