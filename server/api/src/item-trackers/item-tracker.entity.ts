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
import { User } from '../user/user.entity';

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
  userId: number;

  @Column()
  apiKey: string; // deprecated for userId TODO: get rid of apiKey once everyone is moved over to users

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

  @ManyToOne(() => Item, (item) => item.itemTrackers, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'itemId', referencedColumnName: 'id' })
  item?: Item;

  @ManyToOne(() => User, (user) => user.itemTrackers)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
}
