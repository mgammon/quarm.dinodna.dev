import { EventEmitter, Injectable } from '@angular/core';
import { Log } from './log.entity';
import { ApiService } from '../api/api.service';
import * as moment from 'moment';
import { WebsocketService } from '../websocket.service';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  public logs: Log[] = [];
  public logEvents = new EventEmitter<Log[]>();

  public timestampType: 'time' | 'relative' | 'none' = 'time';

  constructor(
    private apiService: ApiService,
    private websocketService: WebsocketService
  ) {
    this.websocketService.logEvents.subscribe(this.onLogs);
    this.loadLogs();
  }

  async loadLogs() {
    const oldestLog = this.logs[0];
    const fetchedLogs = await this.apiService.getLogs(oldestLog);
    this.onLogs(fetchedLogs);
  }

  public onLogs = (logs: Log[]) => {
    logs.forEach((log) => {
      log.sentAt = moment(log.sentAt);
    });
    logs.sort((a, b) => a.sentAt.valueOf() - b.sentAt.valueOf());
    this.logs.push(...logs);

    // Easy mode performance gains, and hope no one needs more than 1.5k logs for now.
    // Virtualized list with scrolling and auto-resize was very buggy
    while (this.logs.length > 1500) {
      this.logs.shift();
    }

    this.logEvents.emit(logs);
  };
}
