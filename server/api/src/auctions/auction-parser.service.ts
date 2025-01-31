import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Log } from '../logs/log.entity';
import { Auction } from './auction.entity';
import { ItemService } from '../items/item.service';

const blackListedItemNames = [
  'king',
  'bandages',
  'gear',
  'leg',
  'rice',
  'ration',
  'egg',
  'urn',
  'buckler',
  'cask',
  'bones',
  'skull',
  'shackles',
  'ale',
  'mace',
  'horn',
  'staff',
  'axe',
  'necklace',
  'drum',
  'pick',
  'paw',
  'pot',
  'rib',
  'torch',
  'sword',
  'pouch',
  'lute',
  'club',
  'emerald',
  'potion',
  'box',
  'roots',
  'knight',
  'box',
  'a shield',
  'liver',
  'wok',
  'key',
  'gor',
];

@Injectable()
export class AuctionParser {
  private wtsIndicators = ['wts', 'selling'];
  private wtbIndicators = ['wtb', 'buying'];

  private items: { id: number; name: string }[] = [];

  constructor(
    @Inject(forwardRef(() => ItemService))
    private itemService: ItemService,
  ) {}

  isAuctioning(log: Log) {
    const auctionIndicators = [...this.wtsIndicators, ...this.wtbIndicators];
    return auctionIndicators.some((ai) => log.text.toLowerCase().includes(ai));
  }

  async getItemsAndPrices(
    text: string,
  ): Promise<{ name: string; id: number; price: number }[]> {
    if (this.items.length === 0) {
      this.items = await this.itemService.getAllItemNames();
      this.items = this.items.filter(
        (item) => !blackListedItemNames.includes(item.name),
      );
    }

    // Find any matching item names in the message, removing matching text as we go
    // so things like Wu's Quivering Staff don't match on Wu's Quivering Staff and Quiver and Staff
    // lol that's a lot to filter on, tho
    const lowerCaseText = text.toLowerCase().replace('`', "'");
    let matchableText = text.toLowerCase().replace('`', "'");
    const matches = this.items
      .filter((item) => {
        const isMatch = matchableText.includes(item.name);
        if (isMatch) {
          matchableText = matchableText.replace(item.name, '');
        }
        return isMatch;
      })
      // Sort by the order it shows up in the original message
      .sort(
        (a, b) => lowerCaseText.indexOf(a.name) - lowerCaseText.indexOf(b.name),
      );

    const platRegex = /[0-9]{1,10}\s*k{0,1}p{0,2}/i;
    const kiloPlatRegex = /[0-9]{1,10}\s*kp{0,2}/i;

    // Figure out the price for each item, if there is one.
    const itemPrices = matches.map((match, i) => {
      const nextMatch = matches[i + 1];

      const matchEndIndex =
        lowerCaseText.indexOf(match.name) + match.name.length;
      const nextMatchStartIndex = nextMatch
        ? lowerCaseText.indexOf(nextMatch.name)
        : lowerCaseText.length;
      const possiblePlatText = lowerCaseText
        .slice(matchEndIndex, nextMatchStartIndex)
        .replace(/x[0-9]{1,2}/i, ''); // Trying to specify quantity and I'm not about that
      const platMatches = platRegex.exec(possiblePlatText);
      let price = 0;
      if (platMatches) {
        const plat = parseFloat(platMatches[0]);
        const multiplier = kiloPlatRegex.test(platMatches[0]) ? 1000 : 1;
        price = Math.round(plat * multiplier);
      }
      return { ...match, price };
    });

    return itemPrices;
  }

  async parseAuctions(log: Log): Promise<Auction[]> {
    const { text } = log;
    let wtsStart = text.search(/wts/i);
    if (wtsStart === -1) {
      wtsStart = text.search(/selling/i);
    }
    let wtbStart = text.search(/wtb/i);
    if (wtbStart === -1) {
      wtbStart = text.search(/buying/i);
    }

    const wtsAndWtb = wtsStart > -1 && wtbStart > -1;

    let wtsChunk: string | null = null;
    let wtbChunk: string | null = null;
    // let idkChunk: string | null = null;

    if (wtsAndWtb && wtbStart > wtsStart) {
      // WTS then WTB
      wtsChunk = text.slice(wtsStart, wtbStart);
      wtbChunk = text.slice(wtbStart);
    } else if (wtsAndWtb && wtsStart > wtbStart) {
      // WTB then WTS
      wtbChunk = text.slice(wtbStart, wtsStart);
      wtsChunk = text.slice(wtsStart);
    } else if (wtsStart > -1) {
      // WTS only
      wtsChunk = text.slice(wtsStart);
    } else if (wtbStart > -1) {
      // WTB only
      wtbChunk = text.slice(wtbStart);
    } else {
      // Couldn't figure out what they wanted to do.  Could be WTT, or didn't say.
      wtsChunk = text;
    }

    const auctions: Auction[] = [];

    // Process WTS
    if (wtsChunk) {
      const chunk = wtsChunk.replace(/wts|selling/gi, '') as string;
      const itemsAndPrices = await this.getItemsAndPrices(chunk);
      auctions.push(
        ...itemsAndPrices.map((itemAndPrice) => ({
          itemText: itemAndPrice.name,
          price: itemAndPrice.price,
          itemId: itemAndPrice.id,
          logId: log.id,
          wts: true,
          player: log.player,
          sentAt: log.sentAt,
        })),
      );
    }

    // Process WTB
    if (wtbChunk) {
      const chunk = wtbChunk.replace(/wtb|buying/gi, '') as string;
      const itemsAndPrices = await this.getItemsAndPrices(chunk);
      auctions.push(
        ...itemsAndPrices.map((itemAndPrice) => ({
          itemText: itemAndPrice.name,
          price: itemAndPrice.price,
          itemId: itemAndPrice.id,
          logId: log.id,
          wts: false,
          player: log.player,
          sentAt: log.sentAt,
        })),
      );
    }

    return auctions;
  }
}
