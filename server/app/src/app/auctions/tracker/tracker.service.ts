import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { ComparableNumber } from '../../items/comparable-number-input.component/comparable-number-input.component';
import { Item } from '../../items/item.entity';
import { Auction, Log } from '../../logs/log.entity';
import { LogService } from '../../logs/log.service';
import { SpeechService } from './speech.service';
import * as moment from 'moment';
import { ApiService } from '../../api/api.service';

export interface ItemTrackerDto {
  id?: number;
  itemId: number;
  price: ComparableNumber;
  wts?: boolean;
  item?: Item;
}

export interface ItemTracker {
  id?: number;
  itemId?: number;
  item?: Item;
  price: ComparableNumber;
  wts?: boolean;
  matchingLogs: Log[];
  saved: boolean;
}

function mapToItemTrackerDto(itemTracker: ItemTracker): ItemTrackerDto {
  const { itemId, price, wts, id, item } = itemTracker;
  return { id, itemId: item?.id || (itemId as number), price, wts };
}

function mapToItemTracker(
  itemTrackerDto: ItemTrackerDto,
  localTracker?: ItemTracker
): ItemTracker {
  const { id, itemId, price, wts, item } = itemTrackerDto;
  const itemTracker: ItemTracker = {
    id,
    itemId,
    price,
    wts,
    item, // TODO:  ONLY RETURN id, name, icon, itemtype from server
    saved: true,
    matchingLogs: [],
  };
  if (localTracker) {
    itemTracker.matchingLogs = localTracker.matchingLogs;
    itemTracker.saved = localTracker.saved;
  }
  return itemTracker;
}

@Injectable({
  providedIn: 'root',
})
export class TrackerService {
  public alertType: 'sound' | 'voice' | 'none';
  public volume: number;

  public itemTrackers: ItemTracker[] = [];

  public trackersChanged = new EventEmitter<void>();

  constructor(
    private logService: LogService,
    private speechService: SpeechService,
    private apiService: ApiService
  ) {
    this.volume = this.loadVolume();
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
          this.saveLocalTrackers();
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

  saveLocalTrackers() {
    const jsonToSave = JSON.stringify(this.itemTrackers);
    localStorage.setItem('auctionTrackers', jsonToSave);
    this.trackersChanged.emit();
  }

  async deleteItemTracker(itemTracker: ItemTracker) {
    if (!itemTracker.id) {
      return;
    }
    await this.apiService.deleteItemTracker(itemTracker.id);
    const indexToDelete = this.itemTrackers.findIndex(
      (tracker) => tracker === itemTracker
    );
    this.itemTrackers.splice(indexToDelete, 1);
    this.saveLocalTrackers();
  }

  async addItemTracker(itemTracker: ItemTracker) {
    const createdTrackerDto = await this.apiService.createItemTracker(
      mapToItemTrackerDto(itemTracker)
    );
    this.itemTrackers.unshift(mapToItemTracker(createdTrackerDto));
    this.saveLocalTrackers();
  }

  async updateItemTracker(itemTracker: ItemTracker) {
    await this.apiService.updateItemTracker(mapToItemTrackerDto(itemTracker));
    this.saveLocalTrackers();
  }

  private async loadTrackers() {
    // Load trackers from localStorage
    const savedJson = localStorage.getItem('auctionTrackers');
    let localItemTrackers: ItemTracker[] = [];
    if (savedJson && savedJson.length > 0) {
      localItemTrackers = JSON.parse(savedJson);
      localItemTrackers.forEach((localTracker) => {
        localTracker.matchingLogs.forEach((matchingLog) => {
          matchingLog.sentAt = moment(matchingLog.sentAt);
        });
        localTracker.matchingLogs.sort(
          (a, b) => a.sentAt.valueOf() - b.sentAt.valueOf()
        );
      });
    }

    // Load trackers from API, then add any matching logs from the local trackers
    this.itemTrackers = (await this.apiService.getItemTrackers()).map((dto) =>
      mapToItemTracker(dto)
    );

    // For each local tracker that doesn't have a matching (by item ID) tracker, create the tracker
    // Ex: haven't ever saved them, but we loaded old ones from local, so we'll create them on the API
    const localTrackersWithoutItemTracker = localItemTrackers.filter((local) =>
      this.itemTrackers.every(
        (tracker) => tracker.itemId !== local.item?.id && !local.id
      )
    );
    for (const localItemTracker of localTrackersWithoutItemTracker) {
      this.itemTrackers.push(
        mapToItemTracker(
          await this.apiService.createItemTracker(
            mapToItemTrackerDto(localItemTracker)
          )
        )
      );
    }

    this.itemTrackers.forEach((itemTracker) => {
      const localItemTracker = localItemTrackers.find(
        (local) => local.item?.id === itemTracker.itemId
      );
      if (localItemTracker) {
        itemTracker.matchingLogs = localItemTracker.matchingLogs;
      }
    });

    // Sort them like localTrackers are sorted (API doesn't track order)
    this.itemTrackers.sort(
      (a, b) =>
        localItemTrackers.findIndex((local) => local.id === a.id) -
        localItemTrackers.findIndex((local) => local.id === b.id)
    );

    if (localTrackersWithoutItemTracker.length) {
      this.saveLocalTrackers();
    }

    this.checkForMatchingLogs(this.logService.logs);
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

  async soundTest() {
    if (this.alertType === 'voice') {
      this.speechService.speak(
        `Crushbone Belt selling for one quadrillion`,
        this.volume
      );
    } else {
      this.alertAudio.volume = this.volume;
      this.alertAudio.play();
    }
  }

  saveVolume() {
    localStorage.setItem('notificationVolume', this.volume.toString());
  }

  loadVolume() {
    return parseFloat(localStorage.getItem('notificationVolume') || '1');
  }

  playAlert(log: Log, auction?: Auction) {
    if (this.alertType === 'none') {
      return;
    } else if (this.alertType === 'sound') {
      this.alertAudio.volume = this.volume;
      this.alertAudio.play();
    } else if (this.alertType === 'voice') {
      let message: string;
      if (auction) {
        message = `${auction.itemText} ${
          auction.wts === true
            ? 'selling'
            : auction.wts === false
            ? 'buying'
            : ''
        } ${auction.price > 0 ? 'for ' + auction.price : 'no price set'}`;
      } else {
        message = log.text;
      }
      this.speechService.speak(message, this.volume);
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
