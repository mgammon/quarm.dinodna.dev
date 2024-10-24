import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { ComparableNumber } from '../../items/comparable-number-input.component/comparable-number-input.component';
import { Item } from '../../items/item.entity';
import { Auction, Log } from '../../logs/log.entity';
import { LogService } from '../../logs/log.service';
import { SpeechService } from './speech.service';
import * as moment from 'moment';

export interface ItemTracker {
  item?: Item;
  price: ComparableNumber;
  wts?: boolean;
  silent?: boolean;
  matchingLogs: Log[];
  onSelectItem?: (item: Item) => void;
  saved: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TrackerService {
  public alertType: 'sound' | 'voice' | 'none';

  public itemTrackers: ItemTracker[] = [];

  public trackersChanged = new EventEmitter<void>();

  constructor(
    private logService: LogService,
    private speechService: SpeechService
  ) {
    this.alertType =
      (localStorage.getItem('trackerAlertType') as any) || 'none';
    this.loadTrackers();
    this.logService.logEvents.subscribe((logs) =>
      this.checkForMatchingLogs(logs)
    );
  }

  public refreshMatchingLogs(itemTracker: ItemTracker) {
    itemTracker.matchingLogs = [];
    this.checkItemTrackerForMatchingLogs(
      itemTracker,
      this.logService.logs,
      false
    );
  }

  public checkItemTrackerForMatchingLogs(
    tracker: ItemTracker,
    logs: Log[],
    sendAlerts: boolean = true
  ) {
    logs.forEach((log) => {
      log.auctions.forEach((auction) => {
        if (
          tracker.item &&
          auction.itemId === tracker.item.id &&
          this.compare(tracker.price, auction.price) &&
          (tracker.wts === undefined || tracker.wts !== auction.wts)
        ) {
          const existingLog = tracker.matchingLogs.find(
            (existing) =>
              existing.player === log.player &&
              existing.auctions.find(
                (existingAuction) => existingAuction.itemId === auction.itemId
              )
          );
          if (!existingLog) {
            // add the matching log to the tracker
            tracker.matchingLogs.push(log);
          } else if (existingLog.sentAt.valueOf() <= log.sentAt.valueOf()) {
            // if a duplicate log was sent, and this one is newer, get rid of the old
            tracker.matchingLogs = tracker.matchingLogs.filter(
              (matchingLog) => matchingLog !== existingLog
            );
            tracker.matchingLogs.push(log);
            tracker.matchingLogs.sort(
              (a, b) => a.sentAt.valueOf() - b.sentAt.valueOf()
            );
          }
          this.saveTrackers();
          if (sendAlerts && logs.length < 50) {
            this.playAlert(log, auction);
          }
          return;
        }
      });
    });
  }

  private checkForMatchingLogs(logs: Log[]) {
    this.itemTrackers.forEach((tracker) => {
      this.checkItemTrackerForMatchingLogs(tracker, logs);
    });
  }

  saveTrackers() {
    const jsonToSave = JSON.stringify(this.itemTrackers);
    localStorage.setItem('auctionTrackers', jsonToSave);
    this.trackersChanged.emit();
  }

  deleteItemTracker(itemTracker: ItemTracker) {
    const indexToDelete = this.itemTrackers.findIndex(
      (tracker) => tracker === itemTracker
    );
    this.itemTrackers.splice(indexToDelete, 1);
    this.saveTrackers();
  }

  addItemTracker(itemTracker: ItemTracker) {
    this.itemTrackers.unshift(itemTracker);
    this.saveTrackers();
  }

  private loadTrackers() {
    const savedJson = localStorage.getItem('auctionTrackers');
    if (savedJson && savedJson.length > 0) {
      this.itemTrackers = JSON.parse(savedJson);
      this.itemTrackers.forEach((tracker) => {
        tracker.matchingLogs.forEach((matchingLog) => {
          matchingLog.sentAt = moment(matchingLog.sentAt);
        });
        tracker.matchingLogs.sort(
          (a, b) => a.sentAt.valueOf() - b.sentAt.valueOf()
        );
      });
    }
  }

  private compare(comparableNumber: ComparableNumber, value: number) {
    if (!comparableNumber.value) {
      return true;
    }
    if (comparableNumber.operator === '<=') {
      return value <= comparableNumber.value;
    } else if (comparableNumber.operator === '<') {
      return value < comparableNumber.value;
    } else if (comparableNumber.operator === '>=') {
      return value >= comparableNumber.value;
    } else if (comparableNumber.operator === '>') {
      return value > comparableNumber.value;
    } else if (comparableNumber.operator === '=') {
      return value === comparableNumber.value;
    }

    return false;
  }

  private alertAudio = new Audio('../../assets/alert.mp3');

  playAlert(log: Log, auction: Auction) {
    if (this.alertType === 'none') {
      return;
    } else if (this.alertType === 'sound') {
      this.alertAudio.play();
    } else if (this.alertType === 'voice') {
      const message = `${auction.itemText} ${
        auction.wts === true ? 'selling' : auction.wts === false ? 'buying' : ''
      } ${auction.price > 0 ? 'for ' + auction.price : 'no price set'}`;
      this.speechService.speak(message);
    }
  }

  toggleAlertType() {
    if (this.alertType === 'none') {
      this.alertType = 'sound';
    } else if (this.alertType === 'sound') {
      this.alertType = 'voice';
    } else {
      this.alertType = 'none';
    }
    localStorage.setItem('trackerAlertType', this.alertType);
  }
}
