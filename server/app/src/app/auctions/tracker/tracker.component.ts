import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Log } from '../../logs/log.entity';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import {
  ComparableNumber,
  ComparableNumberInputComponent,
} from '../../items/comparable-number-input.component/comparable-number-input.component';
import { SearchComponent } from '../../search/search.component';
import { Item } from '../../items/item.entity';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ItemSnippet } from '../../items/item-snippet.component/item-snippet.component';
import { ResultComponent } from '../../search/result.component/result.component';
import { ItemLinkComponent } from '../../items/item-link.component/item-link.component';
import { DataViewModule } from 'primeng/dataview';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { ItemTracker, TrackerService } from './tracker.service';
import * as moment from 'moment';
import { DateFromNowComponent } from "./date-from-now.component";

moment.updateLocale('en', {
  relativeTime: {
    s: '%ds',
    ss: '%ds',
    m: '%dm',
    mm: '%dm',
    h: '%dh',
    hh: '%dh'
  },
});

@Component({
    selector: 'app-tracker',
    standalone: true,
    templateUrl: './tracker.component.html',
    styleUrl: './tracker.component.scss',
    imports: [
        CommonModule,
        PanelModule,
        TabViewModule,
        SearchComponent,
        ButtonModule,
        ComparableNumberInputComponent,
        BadgeModule,
        ItemSnippet,
        ResultComponent,
        ItemLinkComponent,
        DataViewModule,
        TableModule,
        TooltipModule,
        DateFromNowComponent
    ]
})
export class TrackerComponent {
  onTrackersReordered() {
    throw new Error('Method not implemented.');
  }
  protected moment = moment;

  constructor(
    public trackerService: TrackerService,
    private clipboard: Clipboard
  ) {}

  // convenience getter
  get itemTrackers() {
    return this.trackerService.itemTrackers;
  }

  onItemSelected(item: Item, tracker: ItemTracker) {
    const partialItem = {
      id: item.id,
      name: item.name,
      icon: item.icon,
      itemtype: item.itemtype,
    };
    tracker.item = partialItem as Item;

    this.trackerService.saveTrackers();
  }

  toggleWts(tracker: ItemTracker) {
    if (tracker.wts === true) {
      tracker.wts = false;
    } else if (tracker.wts === false) {
      tracker.wts = undefined;
    } else {
      tracker.wts = true;
    }

    this.trackerService.saveTrackers();
  }

  addItemTracker() {
    const newTracker: ItemTracker = {
      price: { operator: '<=' },
      wts: false,
      matchingLogs: [],
      saved: false,
    };
    this.trackerService.addItemTracker(newTracker);
  }

  saveTracker(tracker: ItemTracker) {
    if (tracker.item) {
      tracker.saved = true;
      this.trackerService.refreshMatchingLogs(tracker);
      this.trackerService.saveTrackers();
    }
  }

  deleteItemTracker(tracker: ItemTracker) {
    this.trackerService.deleteItemTracker(tracker);
  }

  editItemTracker(tracker: ItemTracker) {
    tracker.saved = false;
  }

  getMatchingAuctionPriceString(matchingLog: Log, tracker: ItemTracker) {
    const matchingAuction = matchingLog.auctions.find(
      (auction) => auction.itemId === tracker.item?.id
    );

    if (matchingAuction && matchingAuction.price > 0) {
      return `for ${matchingAuction.price}`;
    } else {
      return '(no price)';
    }
  }

  getMatchingAuctionStatusString(matchingLog: Log, tracker: ItemTracker) {
    tracker.wts === true ? 'selling' : tracker.wts === false ? 'buying' : '???';
    const matchingAuction = matchingLog.auctions.find(
      (auction) => auction.itemId === tracker.item?.id
    );

    if (matchingAuction) {
      return matchingAuction.wts === true
        ? 'selling'
        : matchingAuction.wts === false
        ? 'buying'
        : '???';
    } else {
      return '???';
    }
  }

  deleteMatchingLog(matchingLog: Log, tracker: ItemTracker) {
    tracker.matchingLogs = tracker.matchingLogs.filter(
      (log) => log !== matchingLog
    );
    this.trackerService.saveTrackers();
  }
  sendTell(log: Log, tracker: ItemTracker) {
    this.clipboard.copy(`/tell ${log.player} I'll buy the ${tracker.item?.name}`);
  }

  scrollToLog(log: Log) {
    const logElement = document.getElementById(`chat-log-${log.id}`);
    if (!logElement) {
      return;
    }
    logElement.scrollIntoView();
    logElement.classList.add('flash');
    setTimeout(() => {
      logElement.classList.remove('flash');
    }, 333);
    setTimeout(() => {
      logElement.classList.add('flash');
    }, 666);
    setTimeout(() => {
      logElement.classList.remove('flash');
    }, 1000);
  }
}
