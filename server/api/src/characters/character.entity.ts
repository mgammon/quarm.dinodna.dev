import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ synchronize: true, name: 'characters' })
export class Character {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 100 })
  apiKey?: string;

  @Column({ length: 100, nullable: true })
  name?: string;

  @Column({ length: 100, nullable: true })
  guild?: string;

  @Column()
  level: number;

  @Column()
  class: number;

  @Column()
  race: number;

  // array of stats in order: str,sta,agi,dex,wis,int,cha
  @Column({ length: 30 })
  stats: string;

  // array of items by slotId, ex: 123,0,2345,66789896,0...
  @Column({ length: 150 })
  slots: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
