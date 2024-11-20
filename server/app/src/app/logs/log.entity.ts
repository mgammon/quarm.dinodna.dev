import { Moment } from 'moment';

export interface Log {
  id: number;
  player: string;
  text: string;
  sentAt: Moment;
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
  auctions: Auction[];
}

export interface Auction {
  id: number;
  logId: number;
  itemId: number;
  itemText: string;
  price: number;
  wts: boolean;
}

export interface Location {
  coords?: { x: number; y: number; z: number };
  heading?: number;
  zoneId?: string;
  updatedAt?: number;
}
