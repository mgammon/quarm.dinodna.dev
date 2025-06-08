import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { And, ILike, In, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Auction, AuctionSummary, DailyAuction } from './auction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionParser } from './auction-parser.service';
import { Log } from '../logs/log.entity';
import * as moment from 'moment';
import { Item } from '../items/item.entity';
import { Cron } from '@nestjs/schedule';
import { LogService } from '../logs/log.service';
import { clearCache } from '../items/in-memory-cache';

@Injectable()
export class AuctionService {
  constructor(
    @InjectRepository(Auction) private auctionRepository: Repository<Auction>,
    @InjectRepository(DailyAuction)
    private dailyAuctionRepository: Repository<DailyAuction>,
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(Log) private logRepository: Repository<Log>,
    @Inject(forwardRef(() => LogService)) private logService: LogService,
    private auctionParser: AuctionParser,
  ) {}

  // Delete auctions older than 3 days old every night at 4am
  // This is only used to match up logs to items on the auction page (not on the item details page)
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
    }
    return this.auctionRepository.find({ where: { logId: log.id } });
  }

  async upsertDailyAuction(auction: Auction) {
    const dailyAuction = this.mapToDailyAuction(auction);
    const existingDailyAuction = await this.dailyAuctionRepository.findOne({
      where: { key: dailyAuction.key },
    });

    // If there's an existing auction and it's the same price, no changes.
    if (existingDailyAuction && existingDailyAuction.price === dailyAuction.price) {
      return;
    }

    if (existingDailyAuction && dailyAuction.price !== existingDailyAuction.price) {
      // If a daily auction for this key exists, update it
      await this.dailyAuctionRepository.update({ id: existingDailyAuction.id }, dailyAuction);
    } else if (!existingDailyAuction) {
      // Otherwise, insert it
      await this.dailyAuctionRepository.insert(dailyAuction);
    }

    // Update the averages for the item, too
    await this.itemRepository.update({ id: dailyAuction.itemId }, await this.getAverages(dailyAuction.itemId));
  }

  getDailyAuctions(itemId: number, startDate: Date, endDate?: Date) {
    return this.dailyAuctionRepository.find({
      where: {
        itemId,
        sentAt: And(MoreThanOrEqual(startDate), LessThanOrEqual(endDate || new Date())),
        log: { dailyAuctions: { itemId: MoreThanOrEqual(0) } },
      },
      relations: { log: { dailyAuctions: true } },
      select: {
        id: true,
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
          dailyAuctions: { itemText: true, itemId: true, id: true },
        },
      },
      order: { sentAt: 'DESC' },
      take: 300,
      cache: true,
    });
  }

  async getAuctionSummaries(itemId: number, days: number) {
    // Use the average price over that time to remove outliers
    const stats = await this.getStats(itemId, days);
    const maxPrice = stats.average * 7 || 0;
    const minPrice = stats.average / 7 || 0;
    const priceFilter = maxPrice && minPrice ? ` AND price >= ${minPrice} AND price <= ${maxPrice} ` : '';
    const results: AuctionSummary[] = await this.dailyAuctionRepository.query(
      `
    SELECT DATE(sentAt) as date, MIN(price) as min, MAX(price) as max, AVG(price) as average, COUNT(*) as count, wts
    FROM daily_auctions
    WHERE itemId = ?
      AND price > 0
      AND sentAt > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? DAY )
      ${priceFilter}
    GROUP BY itemId, DATE(sentAt), wts
    `,
      [itemId, days],
    );
    return results;
  }

  async getAverage(itemId: number, days: number) {
    // Maybe improved.  Grouping by player so if someone is trying to sell
    // at an unrealistic price for multiple days, it won't skew the average too much
    const dailyAuctions: DailyAuction[] = await this.dailyAuctionRepository.query(
      `
      SELECT MIN(price) as price 
      FROM daily_auctions
      WHERE itemId = ?
        AND price > 0
        AND sentAt > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? DAY )
      GROUP BY player, itemId
      `,
      [itemId, days],
    );

    return this.getAverageFromPrices(dailyAuctions.map((auction) => auction.price)) * 1000 || 0;
  }

  async getAverages(itemId: number) {
    return {
      average7d: await this.getAverage(itemId, 7),
      average30d: await this.getAverage(itemId, 30),
    };
  }

  getAverageFromPrices(prices: number[]) {
    const pricesExcludingOutliers = this.removeOutliersByFactor(prices);
    const average = Math.round(
      pricesExcludingOutliers.reduce((sum, price) => price + sum, 0) / pricesExcludingOutliers.length,
    );

    // Round the number
    if (average > 0 && average <= 25) {
      return Math.round(average);
    } else if (average > 25 && average < 100) {
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
      SELECT MIN(price) as price 
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
      pricesExcludingOutliers.reduce((sum, price) => price + sum, 0) / pricesExcludingOutliers.length,
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
    const median = (numbers[Math.floor(numbers.length / 2)] + numbers[Math.ceil(numbers.length / 2)]) / 2;
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
      await this.dailyAuctionRepository.query(`SELECT itemId FROM daily_auctions GROUP BY itemId`)
    ).map((result) => result.itemId);
    for (const itemId of itemIds) {
      this.itemRepository.update({ id: itemId }, await this.getAverages(itemId));
    }
  }

  mapToDailyAuction(auction: Auction): DailyAuction {
    const key = `${auction.player}.${auction.itemId}.${moment(auction.sentAt).format('YYYY-MM-DD')}`;

    const { logId, itemText, itemId, player, price, wts, sentAt } = auction;

    return { logId, player, itemId, itemText, price, wts, sentAt, key };
  }

  async rerunAuctionParsing(days: number = 30, matchingText?: string) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const logFilters: { sentAt: any; raw?: any } = {
      sentAt: And(MoreThan(start)),
    };
    if (matchingText) {
      logFilters.raw = ILike(`%${matchingText}%`);
    }
    const logCount = await this.logRepository.count({ where: logFilters });
    console.log(
      `Parsing auctions for the last ${days} days, with matching text: ${matchingText} (${logCount} total logs)`,
    );
    // Page over all the logs
    let hasMoreLogs = true;
    let logsRerun = 0;
    const PAGE_SIZE = 500;
    while (hasMoreLogs) {
      // Find all the logs in this page
      const logs = await this.logRepository.find({
        where: logFilters,
        take: PAGE_SIZE,
        skip: logsRerun,
        order: { sentAt: 'ASC' },
      });
      // Delete their auctions
      this.auctionRepository.delete({ logId: In(logs.map((log) => log.id)) });
      this.dailyAuctionRepository.delete({
        logId: In(logs.map((log) => log.id)),
      });
      // Re-parse their auctions
      for (const log of logs) {
        await this.addAuctions(log);
      }
      // Keep track of what log page we're on
      logsRerun += logs.length;
      hasMoreLogs = logs.length === PAGE_SIZE;
      console.log(`Reran auction parsing for ${logsRerun} logs so far (${Math.round((logsRerun / logCount) * 100)}%)`);
    }

    // Reset recent logs, clear auction logs
    this.logService.loadRecentLogs();
    clearCache('itemDailyAuctions');
    clearCache('itemAuctionSummaries');

    console.log('Done rerunning auction parsing');
  }
}
