import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { And, In, IsNull, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Log, LogDto } from './log.entity';
import * as moment from 'moment-timezone';
import { AuctionService } from '../auctions/auction.service';
import { Auction, AuctionDto } from '../auctions/auction.entity';
import { FeedbackService } from '../feedback/feedback.service';
import { JobQueue, UniqueArray } from '../utils';

@Injectable()
export class LogService {
  private recentLogDtos = new UniqueArray<LogDto>(); // Used to cache requests for recent logs
  private recentLogsProcessed = new UniqueArray<string>(); // Used to make sure we only process each line log once when it's sent from multiple log readers
  public logQueue = new JobQueue();

  constructor(
    @InjectRepository(Log) private logRepository: Repository<Log>,
    @Inject(forwardRef(() => AuctionService))
    private auctionService: AuctionService,
    private feedbackService: FeedbackService,
  ) {
    this.loadRecentLogs();
  }

  async loadRecentLogs() {
    this.recentLogDtos.splice(0);
    const logs = await this.logRepository.find({
      relations: { auctions: true },
      order: { sentAt: 'DESC' },
      take: 300,
    });
    const logDtos = logs.map((log) => this.mapToLogDto(log));
    this.recentLogDtos.push(...logDtos);
  }

  getLogs() {
    return this.recentLogDtos;
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

  // If this ever goes multi-threaded/multi-process I'll have to do a for real queue
  async onLogs(receivedLogs: string[]) {
    return new Promise<LogDto[]>((resolve) => {
      this.logQueue.add(() => this.processLogs(receivedLogs), resolve);
    });
  }

  private async processLogs(receivedLogs: string[]) {
    // Only try to process logs that we haven't already processed since we receive logs from lots of people
    const logsNotYetProcessed = receivedLogs.filter((receivedLog) => !this.recentLogsProcessed.includes(receivedLog));
    this.recentLogsProcessed.push(...logsNotYetProcessed);

    const addedLogs: Log[] = [];
    while (logsNotYetProcessed.length > 0) {
      const batch = logsNotYetProcessed.splice(0, 500).map((log) => this.parseLog(log));
      const results = await this.logRepository.createQueryBuilder().insert().values(batch).orIgnore().execute();

      const addedLogIds = results.identifiers.map((ids) => ids.id);
      const batchOfaddedLogs = await this.logRepository.find({
        where: { id: In(addedLogIds) },
      });

      for (const log of batchOfaddedLogs) {
        const auctions = await this.auctionService.addAuctions(log);
        log.auctions = auctions;
        this.feedbackService.sendEcChat(log.raw);
      }
      addedLogs.push(...batchOfaddedLogs);
    }

    const logDtos = addedLogs.map((log) => this.mapToLogDto(log));
    this.recentLogDtos.push(...logDtos);

    return logDtos;
  }

  async reparseLogsFromRaw(count = 0, total?: number, startedAt?: number): Promise<void> {
    if (!startedAt) {
      startedAt = Date.now();
    }
    if (total === undefined) {
      total = await this.logRepository.countBy({ text: '' });
    }
    const logs = await this.logRepository.find({ where: { text: '' }, take: 2000, order: { createdAt: 'DESC' } });
    if (logs.length === 0) {
      return;
    }
    logs.forEach((log) => {
      const reparsedLog = this.parseLog(log.raw);
      log.text = reparsedLog.text;
    });
    await this.logRepository.save(logs);

    count += logs.length;
    const percentComplete = count / total;
    const ellapsedMs = Date.now() - startedAt;
    const estimatedTotalMs = (1 / percentComplete) * ellapsedMs;
    const estimatedTimeLeft = moment(Date.now() + estimatedTotalMs - ellapsedMs).fromNow(true);

    console.log(
      `Reparsed ${count} logs of ${total} (${Math.round(10000 * percentComplete) / 100}%) - ${estimatedTimeLeft}`,
    );

    return this.reparseLogsFromRaw(count, total, startedAt);
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
    const player = channel === 'system' ? '[SYSTEM]' : rawText.split('] ')[1].split(' ')[0];

    // Get the text
    const startOfText = channel === 'system' ? rawText.indexOf('[SYSTEM]') + '[SYSTEM]'.length : rawText.indexOf(', ');

    const text = rawText.slice(startOfText + 1, rawText.length - 1).replace('`', "'");

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
      auctions: auctions ? auctions.map((auction) => this.mapToAuctionDto(auction)) : [],
    };
  }

  mapToAuctionDto(auction: Auction): AuctionDto {
    const { logId, itemId, itemText, price, wts } = auction;
    return { logId, itemId, itemText, price, wts };
  }
}
