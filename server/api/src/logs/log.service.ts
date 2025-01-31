import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  And,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Log, LogDto } from './log.entity';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { AuctionService } from '../auctions/auction.service';
import { Auction, AuctionDto } from '../auctions/auction.entity';
import { config } from '../config';
import { FeedbackService } from '../feedback/feedback.service';

@Injectable()
export class LogService {
  private recentLogs: LogDto[] = [];

  constructor(
    @InjectRepository(Log) private logRepository: Repository<Log>,
    @Inject(forwardRef(() => AuctionService))
    private auctionService: AuctionService,
    private feedbackService: FeedbackService,
  ) {
    this.loadRecentLogs();
  }

  async loadRecentLogs() {
    while (this.recentLogs.length) {
      this.recentLogs.shift();
    }
    const logs = await this.logRepository.find({
      relations: { auctions: true },
      order: { sentAt: 'DESC' },
      take: 300,
    });
    const logDtos = logs.map((log) => this.mapToLogDto(log));
    this.recentLogs.push(...logDtos);
  }

  getLogs() {
    return this.recentLogs;
  }

  getLogsBefore(before: number, size = 10) {
    return this.logRepository.find({
      where: { id: And(LessThan(before), MoreThanOrEqual(before - size)) },
    });
  }

  getLogsAfter(after: number, size = 10) {
    return this.logRepository.find({
      where: { id: And(MoreThan(after), LessThanOrEqual(after + size)) },
    });
  }

  getRawLogsBefore(before: number, size = 10) {
    return this.logRepository.find({
      where: { id: And(LessThan(before), MoreThanOrEqual(before - size)) },
      select: ['id', 'raw'],
    });
  }

  getRawLogsAfter(after: number, size = 10) {
    return this.logRepository.find({
      where: { id: And(MoreThan(after), LessThanOrEqual(after + size)) },
      select: ['id', 'raw'],
    });
  }

  async onLogs(rawLogs: string[]) {
    if (config.noNewLogs) {
      return [];
    }
    const logsToAdd = rawLogs.map((rawText) => this.parseLog(rawText));

    const logs: Log[] = [];
    while (logsToAdd.length > 0) {
      const batch = logsToAdd.splice(0, 500);
      const results = await this.logRepository
        .createQueryBuilder()
        .insert()
        .values(batch)
        .orIgnore()
        .execute();

      const addedLogIds = results.identifiers.map((ids) => ids.id);
      const addedLogs = await this.logRepository.find({
        where: { id: In(addedLogIds) },
      });

      for (const log of addedLogs) {
        const auctions = await this.auctionService.addAuctions(log);
        log.auctions = auctions;
        this.feedbackService.sendEcChat(log.raw);
      }
      logs.push(...addedLogs);
    }

    const logDtos = logs.map((log) => this.mapToLogDto(log));
    this.recentLogs.push(...logDtos);
    while (this.recentLogs.length > 300) {
      this.recentLogs.shift();
    }

    return logs.map((log) => this.mapToLogDto(log));
  }

  // [Tue Jul 09 12:35:58 2024] Yaface auctions, 'WTB ur mom - PST'
  parseLog(rawText: string): LogDto & { raw: string } {
    // Get the sentAt date
    const dateText = rawText.split(']')[0].replace('[', '');
    const utcOffset = moment.tz(new Date(), 'America/Chicago').utcOffset();
    const sentAt = moment(dateText).subtract(utcOffset, 'minutes').toDate();

    // Get the channel
    const channelChunk = rawText.split(',')[0];
    const channel = channelChunk.includes('[SYSTEM]')
      ? 'system'
      : channelChunk.includes('BROADCASTS')
        ? 'broadcast'
        : channelChunk.includes('General:')
          ? 'global-General'
          : channelChunk.includes('Lfg:')
            ? 'global-Lfg'
            : channelChunk.includes('Auction:')
              ? 'global-Auction'
              : channelChunk.includes('Port:')
                ? 'global-Port'
                : channelChunk.includes('auctions')
                  ? 'auction'
                  : channelChunk.includes('out of character')
                    ? 'ooc'
                    : channelChunk.includes('shouts')
                      ? 'shout'
                      : channelChunk.includes('says')
                        ? 'say'
                        : null;

    // Get the player
    const player =
      channel === 'system' ? '[SYSTEM]' : rawText.split('] ')[1].split(' ')[0];

    // Get the text
    const startOfText =
      channel === 'system'
        ? rawText.indexOf('[SYSTEM]') + '[SYSTEM]'.length
        : rawText.indexOf(', ');

    const text = rawText
      .slice(startOfText + 1, rawText.length - 1)
      .replace('`', "'");

    return { raw: rawText, player, text, channel, sentAt };
  }

  mapToLogDto(log: Log): LogDto {
    const { id, player, text, sentAt, channel, auctions } = log;
    return {
      id,
      player,
      text,
      sentAt,
      channel,
      auctions: auctions
        ? auctions.map((auction) => this.mapToAuctionDto(auction))
        : [],
    };
  }

  mapToAuctionDto(auction: Auction): AuctionDto {
    const { logId, itemId, itemText, price, wts } = auction;
    return { logId, itemId, itemText, price, wts };
  }
}
