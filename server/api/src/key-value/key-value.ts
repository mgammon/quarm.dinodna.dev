import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: true, name: 'keyvalues' })
export class KeyValue {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 100, unique: true })
  key?: string;

  @Column({ length: 100 })
  value?: string;
}
