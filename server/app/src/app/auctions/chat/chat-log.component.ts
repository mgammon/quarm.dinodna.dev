import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogService } from '../../logs/log.service';
import { Auction, Log } from '../../logs/log.entity';
import { ItemLinkComponent } from '../../items/item-link.component/item-link.component';
import { TrackerService } from '../tracker/tracker.service';
import * as moment from 'moment';
import { Theme, ThemeService } from '../../../themes/theme.service';

interface LogChunk {
  type: 'time' | 'player' | 'text' | 'item';
  item?: Auction;
  displayText?: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-chat-log',
  standalone: true,
  templateUrl: './chat-log.component.html',
  styleUrl: './chat-log.component.scss',
  imports: [CommonModule, ItemLinkComponent],
})
export class ChatLogComponent implements OnInit {
  public colorScheme: string;

  @Input({ required: true })
  public log!: Log;

  @Input({ required: false })
  public highlightItemId?: number;

  @Input({ required: false })
  public timeFormat?: string; // time, relative, dates, idk

  public timestamp!: string;
  public logChunks: LogChunk[] = [];

  protected moment = moment;
  public highlightLog: boolean = false;

  constructor(
    public logService: LogService,
    public trackerService: TrackerService,
    themeService: ThemeService
  ) {
    this.colorScheme =
      themeService.theme === Theme.LaraDarkBlue ? 'dark' : 'light';
  }

  updateHighlights() {
    // Highlight the log
    this.highlightLog = this.trackerService.itemTrackers.some((tracker) =>
      tracker.matchingLogs.some((matchingLog) => matchingLog.id === this.log.id)
    );

    // Highlight an item chunk
    this.logChunks.forEach((chunk) => {
      const item = chunk.item;
      if (!item) {
        return;
      }
      chunk.highlight =
        this.log.auctions.some(
          (auction) =>
            auction.itemId === item.itemId &&
            item.itemId === this.highlightItemId
        ) ||
        this.trackerService.itemTrackers.some((tracker) =>
          tracker.matchingLogs.some(
            (log) =>
              log.id === this.log.id &&
              this.log.auctions.some(
                (auction) =>
                  auction.itemId === item.itemId &&
                  tracker.item &&
                  item.itemId === tracker.item.id
              )
          )
        );
    });
  }

  ngOnInit() {
    this.timestamp =
      this.timeFormat === 'relative'
        ? this.log.sentAt.fromNow()
        : this.log.sentAt.format('LTS');

    // Start with /*time*/ and player chunks
    this.logChunks.push({ type: 'player' });

    // Add the channel flavor text
    const channelText =
      this.log.channel === 'system'
        ? ' '
        : this.log.channel === 'broadcast'
        ? ' BROADCASTS,'
        : this.log.channel === 'global-General'
        ? ' tells General,'
        : this.log.channel === 'global-Lfg'
        ? ' tells Lfg,'
        : this.log.channel === 'global-Auction'
        ? ' tells Auction,'
        : this.log.channel === 'global-Port'
        ? ' tells Port,'
        : this.log.channel === 'auction'
        ? ' auctions,'
        : this.log.channel === 'ooc'
        ? ' says out of character,'
        : this.log.channel === 'shout'
        ? ' shouts,'
        : ' says,';
    this.logChunks.push({ type: 'text', displayText: channelText });

    let unparsedText = this.log.text + '';
    this.log.auctions.sort((a, b) => a.id - b.id);
    for (const auction of this.log.auctions) {
      // Find the start and end of the item text
      const itemStartIndex = unparsedText
        .toLowerCase()
        .indexOf(auction.itemText);
      const itemEndIndex = itemStartIndex + auction.itemText.length;
      // If there's text before the item, add that chunk.
      if (itemStartIndex > 0) {
        this.logChunks.push({
          type: 'text',
          displayText: unparsedText.slice(0, itemStartIndex),
        });
      }

      // Add the item chunk
      this.logChunks.push({
        type: 'item',
        item: auction,
        displayText: unparsedText.slice(itemStartIndex, itemEndIndex),
      });
      unparsedText = unparsedText.slice(itemEndIndex);
    }

    // Add a text chunk after the last item
    this.logChunks.push({ type: 'text', displayText: unparsedText + "'" });

    this.updateHighlights();
    this.trackerService.trackersChanged.subscribe(() => {
      // Specifying the item ID to highlight, so not dependent on trackers, no need to update when they change
      if (this.highlightItemId) {
        return;
      }
      // Orrr update highlights based on trackers when using them
      this.updateHighlights();
    });
  }
}
