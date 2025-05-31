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

@Entity({ synchronize: true, name: 'verification' })
export class Verification {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 100 })
  apiKey: string;

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
}

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

  @OneToMany(() => InventorySlot, (inventorySlot) => inventorySlot.character)
  @JoinColumn({ name: 'id', referencedColumnName: 'characterId' })
  inventory?: InventorySlot[];
}

@Entity({ synchronize: true, name: 'inventory_slot' })
export class InventorySlot {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  characterId: number;

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
}
