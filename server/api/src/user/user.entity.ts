import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToMany } from 'typeorm';
import { Character, InventorySlot, Verification } from '../characters/character.entity';
import { ItemTracker } from '../item-trackers/item-tracker.entity';

@Entity({ synchronize: true, name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  apiKey: string;

  @Column({ default: false })
  canSendPublicLogs: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => InventorySlot, (inventorySlot) => inventorySlot.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  inventory?: InventorySlot[];

  @OneToMany(() => ItemTracker, (itemTracker) => itemTracker.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  itemTrackers?: ItemTracker[];

  @OneToMany(() => Character, (character) => character.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  characters?: Character[];

  @OneToMany(() => Verification, (verification) => verification.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  verifications?: Verification[];
}
