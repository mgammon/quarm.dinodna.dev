import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'rule_values', synchronize: false })
export class Rule {
  @PrimaryColumn() ruleset_id: string;
  @PrimaryColumn() rule_name: string;
  @Column() rule_value: string;
}
