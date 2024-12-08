import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogService } from '../../logs/log.service';
import { Log } from '../../logs/log.entity';
import { ChatLogComponent } from './chat-log.component';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { TrackerService } from '../tracker/tracker.service';
import { IgnoreListComponent } from './ignore-list/ignore-list.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  imports: [
    CommonModule,
    ChatLogComponent,
    PanelModule,
    TooltipModule,
    IgnoreListComponent,
  ],
})
export class ChatComponent implements OnInit {
  @ViewChildren('chatWindow')
  private chatWindow!: QueryList<ElementRef>;

  public logs: Log[] = [];

  filterMessagesWithAlerts = false;

  shouldScrollToBottom = true;
  hasScrolledAboveBottom = false;
  hasDoneFirstAutoScroll = false;

  lastScrollTop = 0;

  constructor(
    public logService: LogService,
    private trackerService: TrackerService
  ) {}

  ngOnInit() {
    this.hasDoneFirstAutoScroll = false;
    this.setLogs();
    this.logService.logEvents.subscribe((logs) => {
      this.setLogs(logs);
      this.autoScroll();
    });
  }

  hasLogsWithAlerts(logs?: Log[]) {
    return (
      !logs ||
      logs.some((log) =>
        this.trackerService.itemTrackers.some((tracker) =>
          tracker.matchingLogs.some((matchingLog) => matchingLog === log)
        )
      )
    );
  }

  setLogs(logs?: Log[]) {
    if (this.filterMessagesWithAlerts) {
      if (this.hasLogsWithAlerts(logs)) {
        this.logs = this.logService.logs.filter((log) =>
          this.trackerService.itemTrackers.some((tracker) =>
            tracker.matchingLogs.some(
              (matchingLog) => matchingLog.id === log.id
            )
          )
        );
      }
    } else {
      this.logs = this.logService.logs;
    }
  }

  onScroll(event: any) {
    const elementRef = this.chatWindow.first;
    if (!elementRef) {
      return;
    }
    const el = elementRef.nativeElement;
    if (this.lastScrollTop - el.scrollTop > 5) {
      // Scrolled up significantly, stop auto-scrolling to bottom
      this.shouldScrollToBottom = false;
    } else if (!this.shouldScrollToBottom) {
      // Scrolled down, maybe all the way to the bottom.  If so, start auto-scrolling to bottom again
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
      this.shouldScrollToBottom = isAtBottom;
    }
    this.lastScrollTop = el.scrollTop;
  }

  autoScroll() {
    // Check if it was scrolled to the bottom before we rendered this new log info
    const elementRef = this.chatWindow.first;
    if (this.shouldScrollToBottom || !this.hasDoneFirstAutoScroll) {
      setTimeout(() => {
        const el = elementRef.nativeElement;
        el.scrollTop = el.scrollHeight;
        this.hasDoneFirstAutoScroll = true;
      }, 33);
    }
  }

  toggleFilterMessagesWithAlerts() {
    this.filterMessagesWithAlerts = !this.filterMessagesWithAlerts;
    this.setLogs();
  }
}
