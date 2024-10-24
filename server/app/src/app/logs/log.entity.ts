import { Moment } from "moment";

export interface Log {
  id: number;
  player: string;
  text: string;
  sentAt: Moment;
  channel: 'ooc' | 'auction' | 'shout' | 'say' | null;
  auctions: Auction[];
}

export interface Auction {
  logId: number;
  itemId: number;
  itemText: string;
  price: number;
  wts: boolean;
}

export interface Location {
  coords?: { x: number, y: number, z: number};
  heading?: number;
  zoneId?: string;
  updatedAt?: number;
}