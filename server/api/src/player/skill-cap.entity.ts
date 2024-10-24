import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'skill_caps', synchronize: false })
export class SkillCap {
  @PrimaryGeneratedColumn() id: number;
  @Column() skillID: number;
  @Column() class: number;
  @Column() level: number;
  @Column() cap: number;
}
