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
  Index,
} from 'typeorm';

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
  @Column()
  @Index()
  logId: number;

  @ManyToOne(() => Log, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
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
@Index(['itemId', 'price', 'sentAt'])
@Index(['player', 'itemId'])
@Index(['itemId', 'sentAt'])
export class DailyAuction extends Auction {
  @Column()
  @Index()
  key: string;
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
