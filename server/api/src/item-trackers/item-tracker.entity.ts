import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Item } from '../items/item.entity';
import { ComparableNumber } from '../utils';

export interface ItemTrackerDto {
  id?: number;
  item?: Partial<Item>;
  itemId: number;
  wts: boolean;
  requirePrice: boolean;
  price: ComparableNumber;
}

@Entity({ synchronize: true, name: 'item_trackers' })
export class ItemTracker {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  apiKey: string;

  @Column({ nullable: true })
  itemId: number;

  @Column({ nullable: true })
  wts: boolean;

  @Column({ nullable: true })
  priceValue: number;

  @Column({ default: false })
  requirePrice: boolean;

  @Column()
  priceOperator: '>' | '>=' | '=' | '<=' | '<';

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => Item, (item) => item.itemTrackers)
  @JoinColumn({ name: 'itemId', referencedColumnName: 'id' })
  item?: Item;
}
