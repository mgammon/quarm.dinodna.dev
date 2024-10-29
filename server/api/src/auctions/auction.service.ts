import { Injectable } from '@nestjs/common';
import {
  And,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Auction, AuctionSummary, DailyAuction } from './auction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionParser } from './auction-parser.service';
import { Log } from '../logs/log.entity';
import * as moment from 'moment';
import { Item } from '../items/item.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AuctionService {
  constructor(
    @InjectRepository(Auction) private auctionRepository: Repository<Auction>,
    @InjectRepository(DailyAuction)
    private dailyAuctionRepository: Repository<DailyAuction>,
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    private auctionParser: AuctionParser,
  ) {}

  // Delete auctions older than 3 days old every night at 4am
  @Cron('0 4 * * *')
  async deleteOldAuctions() {
    console.log('Deleting old auctions');
    const cutOffDate = moment().subtract(3, 'days').toDate();
    await this.auctionRepository.delete({
      createdAt: LessThan(cutOffDate),
    });
  }

  async addAuctions(log: Log) {
    const auctions = await this.auctionParser.parseAuctions(log);

    for (const auction of auctions) {
      await this.auctionRepository.insert(auction);
      await this.upsertDailyAuction(auction);
      await this.getStats(auction.itemId, 7);
    }
    return this.auctionRepository.find({ where: { logId: log.id } });
  }

  async upsertDailyAuction(auction: Auction) {
    const dailyAuction = this.mapToDailyAuction(auction);
    const existingDailyAuction = await this.dailyAuctionRepository.findOne({
      where: { key: dailyAuction.key },
    });

    // If there's an existing auction and it's the same price, no changes.
    if (
      existingDailyAuction &&
      existingDailyAuction.price === dailyAuction.price
    ) {
      return;
    }

    if (
      existingDailyAuction &&
      dailyAuction.price !== existingDailyAuction.price
    ) {
      // If a daily auction for this key exists, update it
      await this.dailyAuctionRepository.update(
        { id: existingDailyAuction.id },
        dailyAuction,
      );
    } else if (!existingDailyAuction) {
      // Otherwise, insert it
      await this.dailyAuctionRepository.insert(dailyAuction);
    }

    // Update the averages for the item, too
    await this.itemRepository.update(
      { id: dailyAuction.itemId },
      await this.getAverages(dailyAuction.itemId),
    );
  }

  // Would be nice to exclude outliers.
  // Maybe get the average for the time range first, then filter where prices are within x10 or something
  getDailyAuctions(itemId: number, startDate: Date, endDate?: Date) {
    return this.dailyAuctionRepository.find({
      where: {
        itemId,
        createdAt: And(
          MoreThanOrEqual(startDate),
          LessThanOrEqual(endDate || new Date()),
        ),
        log: { auctions: { itemId: MoreThanOrEqual(0) } },
      },
      relations: { log: { auctions: true } },
      select: {
        sentAt: true,
        wts: true,
        logId: true,
        player: true,
        price: true,
        log: {
          text: true,
          channel: true,
          sentAt: true,
          player: true,
          auctions: { itemText: true, itemId: true, id: true },
        },
      },
      order: { sentAt: 'DESC' },
    });
  }

  async getAuctionSummaries(itemId: number, days: number) {
    const results: AuctionSummary[] = await this.dailyAuctionRepository.query(
      `
    SELECT DATE(sentAt) as date, MIN(price) as min, MAX(price) as max, AVG(price) as average, COUNT(*) as count, wts
    FROM daily_auctions
    WHERE itemId = ?
      AND price > 0
      AND sentAt > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? DAY )
    GROUP BY itemId, DATE(sentAt), wts
    `,
      [itemId, days],
    );
    return results;
  }

  async getAverages(itemId: number) {
    // Maybe improved.  Grouping by player so if someone is trying to sell
    // at an unrealistic price for multiple days, it won't skew the average too much
    const dailyAuctions: DailyAuction[] =
      await this.dailyAuctionRepository.query(
        `
      SELECT MIN(price) as price, player, MAX(sentAt) as sentAt 
      FROM daily_auctions
      WHERE itemId = ?
        AND price > 0
        AND sentAt > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY )
      GROUP BY player, itemId
      `,
        [itemId],
      );

    const sevenDaysAgo = moment().subtract(7, 'days').toDate().getTime();
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate().getTime();
    const last7Days = dailyAuctions
      .filter((auction) => auction.sentAt.getTime() > sevenDaysAgo)
      .map((auction) => auction.price);
    const last30Days = dailyAuctions
      .filter((auction) => auction.sentAt.getTime() > thirtyDaysAgo)
      .map((auction) => auction.price);

    return {
      average7d: this.getAverageFromPrices(last7Days) * 1000 || 0,
      average30d: this.getAverageFromPrices(last30Days) * 1000 || 0,
    };
  }

  getAverageFromPrices(prices: number[]) {
    const pricesExcludingOutliers = this.removeOutliersByFactor(prices);
    const average = Math.round(
      pricesExcludingOutliers.reduce((sum, price) => price + sum, 0) /
        pricesExcludingOutliers.length,
    );

    // Round the number
    if (average > 25 && average < 100) {
      // 25 - 100 = round to nearest 5
      return Math.ceil(average / 5) * 5;
    } else if (average > 100 && average < 1000) {
      // 100 - 1000 = round to nearest 25
      return Math.ceil(average / 25) * 25;
    } else if (average > 1000) {
      // over 1000 = round to nearest 100
      return Math.ceil(average / 100) * 100;
    }

    return null;
  }

  async getStats(itemId: number, days: number) {
    // Maybe improved.  Grouping by player so if someone is trying to sell
    // at an unrealistic price for multiple days, it won't skew the average too much
    const auctions = await this.dailyAuctionRepository.query(
      `
      SELECT MIN(price) as price, player, MAX(sentAt) as sentAt 
      FROM daily_auctions
      WHERE itemId = ?
        AND price > 0
        AND sentAt > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? DAY )
      GROUP BY player, itemId
      `,
      [itemId, days],
    );

    // Remove outliers and get the average
    const prices = auctions.map((auction) => auction.price);
    const pricesExcludingOutliers = this.removeOutliersByFactor(prices);
    let average = Math.round(
      pricesExcludingOutliers.reduce((sum, price) => price + sum, 0) /
        pricesExcludingOutliers.length,
    );

    // Round the number
    if (average > 25 && average < 100) {
      // 25 - 100 = round to nearest 5
      average = Math.ceil(average / 5) * 5;
    } else if (average > 100 && average < 1000) {
      // 100 - 1000 = round to nearest 25
      average = Math.ceil(average / 25) * 25;
    } else if (average > 1000) {
      // over 1000 = round to nearest 100
      average = Math.ceil(average / 100) * 100;
    }

    const numberOfSellers = prices.length;

    return { average, numberOfSellers };
  }

  removeOutliersByFactor(numbers: number[], factor: number = 5) {
    if (numbers.length < 4) {
      return numbers;
    }
    numbers.sort((a, b) => a - b);
    const median =
      (numbers[Math.floor(numbers.length / 2)] +
        numbers[Math.ceil(numbers.length / 2)]) /
      2;
    const maxValue = median * factor;
    const minValue = median / factor;

    return numbers.filter((num) => num >= minValue && num <= maxValue);
  }

  // Not using.  wasn't great even with a really high factor.
  // simple byFactor one above is better.
  // removeOutliersWithMedianIqr(numbers: number[]) {
  //   if (numbers.length < 4) {
  //     return numbers;
  //   }

  //   numbers.sort((a, b) => a - b);
  //   const q1 = numbers[Math.floor(numbers.length / 4)];
  //   const q3 = numbers[Math.ceil(numbers.length * (3 / 4))];
  //   const normalIqrRange = (q3 - q1) * 10;
  //   const minValue = q1 - normalIqrRange;
  //   const maxValue = q3 + normalIqrRange;

  //   const pricesExcludingOutliers = numbers.filter(
  //     (num) => num >= minValue && num <= maxValue,
  //   );

  //   if (!pricesExcludingOutliers.length) {
  //     return numbers;
  //   } else {
  //     return pricesExcludingOutliers;
  //   }
  // }

  async updateAllAverages() {
    const itemIds: number[] = (
      await this.dailyAuctionRepository.query(
        `SELECT itemId FROM daily_auctions GROUP BY itemId`,
      )
    ).map((result) => result.itemId);
    for (const itemId of itemIds) {
      this.itemRepository.update(
        { id: itemId },
        await this.getAverages(itemId),
      );
    }
  }

  mapToDailyAuction(auction: Auction): DailyAuction {
    const key = `${auction.player}.${auction.itemId}.${moment(
      auction.sentAt,
    ).format('YYYY-MM-DD')}`;

    const { logId, itemText, itemId, player, price, wts, sentAt } = auction;

    return { logId, player, itemId, itemText, price, wts, sentAt, key };
  }
}
