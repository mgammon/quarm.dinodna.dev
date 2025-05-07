import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { KeyValue } from './key-value';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DatabaseUpdater } from '../admin/database-updater';
import { FeedbackService } from '../feedback/feedback.service';

const CURRENT_DUMP_NAME_KEY = 'current_dump_name';

@Injectable()
export class KeyValueService {
  private isUpdaterRunning = false;

  constructor(
    @InjectRepository(KeyValue)
    private keyValueRepository: Repository<KeyValue>,
    private feedbackService: FeedbackService,
  ) {}

  // Check if there's a new DB dump every hour
  @Cron('0 * * * *')
  async autoUpdate() {
    if (this.isUpdaterRunning) {
      return;
    }
    console.log('Checking for a newer Quarm DB dump...');
    // Check our current DB dump name against the most recent dump in the SecretsOfTheP repo
    const mostRecentDump = await DatabaseUpdater.getMostRecentQuarmDump();
    const currentDumpNameKeyValue = await this.getKeyValue(
      CURRENT_DUMP_NAME_KEY,
    );
    // If we couldn't check the repo, or we could and we're already using the most recent dump, no need to update.
    if (
      !mostRecentDump ||
      (currentDumpNameKeyValue &&
        mostRecentDump.name === currentDumpNameKeyValue.value)
    ) {
      console.log('No update needed; still on the most recent DB dump');
      return;
    }

    // Update using the most recent DB dump
    this.isUpdaterRunning = true;
    try {
      console.log('Newer version found:', mostRecentDump.name, 'updating...');
      await new DatabaseUpdater().initializeQuarmData(
        true,
        mostRecentDump.download_url,
      );
      // Remember the DB dump name we just run
      await this.setKeyValue(CURRENT_DUMP_NAME_KEY, mostRecentDump.name);
      console.log('Successfully auto-updated the DB to', mostRecentDump.name);
      this.feedbackService.sendGeneral(
        `[${process.env.NODE_ENV}] Successfully auto-updated the DB to ${mostRecentDump.name}`,
      );
    } catch (ex) {
      this.feedbackService.sendGeneral(
        `[${process.env.NODE_ENV}] Error auto-updating the DB ${ex}`,
      );
    } finally {
      this.isUpdaterRunning = false;
    }
  }

  private async getKeyValue(key: string) {
    const keyValue = await this.keyValueRepository.findOne({ where: { key } });
    if (!keyValue) {
      return null;
    } else {
      return keyValue;
    }
  }

  private setKeyValue(key: string, value: string) {
    return this.keyValueRepository.upsert({ key, value }, ['key']);
  }
}
