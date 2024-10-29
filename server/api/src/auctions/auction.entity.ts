import { Log } from '../logs/log.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  // Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

abstract class AuctionItem {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  itemId?: number;

  @Column()
  price: number;

  @Column()
  wts: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}

@Entity({ synchronize: true, name: 'auctions' })
export class Auction extends AuctionItem {
  @Column() logId: number;

  @ManyToOne(() => Log, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'logId', referencedColumnName: 'id' })
  log?: Log;

  @Column()
  itemText: string;

  @Column()
  player: string;

  @Column({ nullable: true })
  sentAt: Date;
}

// player-mm-dd-yyyy-itemId
// window/partition query is slow
// don't wanna turn sentAt into a date everytime, so I'll precompute the key
@Entity({ synchronize: true, name: 'daily_auctions' })
@Unique('unique-by-key', ['key'])
export class DailyAuction extends Auction {
  @Column()
  key: string;
}

@Entity({ synchronize: true, name: 'auction_trackers' })
export class AuctionTracker extends AuctionItem {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
}

export interface AuctionDto {
  logId: number;
  itemId: number;
  itemText: string;
  price: number;
  wts: boolean;
}

export interface AuctionSummary {
  date: string;
  min: number;
  max: number;
  average: number;
  count: number;
  wts: boolean;
}
