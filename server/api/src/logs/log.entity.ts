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
import { Auction, AuctionDto } from '../auctions/auction.entity';

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
@Unique(['player', 'text', 'sentAt'])
export class Log {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  player: string;

  @Column()
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

  @OneToMany(() => Auction, (auction) => auction.log)
  @JoinColumn({ name: 'id', referencedColumnName: 'logId' })
  auctions?: Auction[];
}
