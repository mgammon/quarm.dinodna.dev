import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  // Unique,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Auction, AuctionDto, DailyAuction } from '../auctions/auction.entity';

export interface LogDto {
  id?: number;
  player: string;
  text: string;
  sentAt: Date;
  channel:
    | 'system'
    | 'broadcast'
    | 'ooc'
    | 'auction'
    | 'shout'
    | 'say'
    | 'global-General'
    | 'global-Auction'
    | 'global-Lfg'
    | 'global-Port'
    | null;
  auctions?: AuctionDto[];
}

@Entity({ synchronize: true, name: 'logs' })
export class Log {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  player: string;

  @Column({ type: 'varchar', length: 1000 })
  text: string;

  @Column()
  raw: string;

  @Column({ nullable: true })
  channel:
    | 'system'
    | 'broadcast'
    | 'ooc'
    | 'auction'
    | 'shout'
    | 'say'
    | 'global-General'
    | 'global-Auction'
    | 'global-Lfg'
    | 'global-Port'
    | null;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  // Needed for the auction page (not item-details)
  @OneToMany(() => Auction, (auction) => auction.log)
  @JoinColumn({ name: 'id', referencedColumnName: 'logId' })
  auctions?: Auction[];

  @OneToMany(() => DailyAuction, (auction) => auction.log)
  @JoinColumn({ name: 'id', referencedColumnName: 'logId' })
  dailyAuctions?: DailyAuction[];
}
