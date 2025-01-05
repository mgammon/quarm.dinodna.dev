import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'skill_caps', synchronize: false })
export class SkillCap {
  @PrimaryGeneratedColumn() id: number;
  @Column() skill_id: number;
  @Column() class_id: number;
  @Column() level: number;
  @Column() cap: number;
}
