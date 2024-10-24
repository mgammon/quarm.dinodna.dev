import { AuctionTracker } from '../auctions/auction.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export type LogChannel = 'ooc' | 'auction' | 'shout' | 'say' | null;

@Entity({ synchronize: true, name: 'user' })
export class User {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => AuctionTracker, (auction) => auction.user)
  auctionTrackers: AuctionTracker[];

  @Column()
  isConnected: boolean;

  @Column()
  sentAt: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
