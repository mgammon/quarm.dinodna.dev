import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity({ synchronize: true, name: 'verification_codes' })
export class Verification {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  userId: number;

  @Column()
  code: string;

  @Column({ length: 100, nullable: true })
  name?: string;

  @Column({ nullable: true })
  isMule?: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => User, (user) => user.verifications)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
}

@Entity({ synchronize: true, name: 'characters' })
export class Character {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  userId: number;

  @Column({ length: 100, nullable: true })
  name?: string;

  @Column({ length: 100, nullable: true })
  guild?: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 1 })
  class: number;

  @Column({ default: 1 })
  race: number;

  // array of stats in order: str,sta,agi,dex,wis,int,cha
  @Column({ length: 30, default: '0,0,0,0,0,0,0' })
  stats: string;

  // array of items by slotId, ex: 123,0,2345,66789896,0...
  @Column({ length: 150, default: ',,,,,,,,,,,,,,,,,,,,,,' })
  slots: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany(() => InventorySlot, (inventorySlot) => inventorySlot.character)
  @JoinColumn({ name: 'id', referencedColumnName: 'characterId' })
  inventory?: InventorySlot[];

  @ManyToOne(() => User, (user) => user.characters)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column({ nullable: true })
  accountLabel?: string; // Multiple characters share the same shared bank if this matches between them
}

@Entity({ synchronize: true, name: 'inventory_slot' })
export class InventorySlot {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  characterId: number;

  @Column({ nullable: true })
  accountLabel?: string; // Multiple characters share the same shared bank if this matches between them

  @Column({ length: 100, nullable: true })
  slot?: string;

  @Column({ nullable: true })
  itemId: number;

  @Column({ nullable: true })
  count: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => Character, (character) => character.inventory)
  @JoinColumn({ name: 'characterId', referencedColumnName: 'id' })
  character: Character;

  @ManyToOne(() => User, (user) => user.inventory)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
}
