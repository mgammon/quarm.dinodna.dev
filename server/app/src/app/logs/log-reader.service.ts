import { EventEmitter, Injectable } from '@angular/core';
import { Log } from './log.entity';
import { LocationService } from './location.service';
import { WebsocketService } from '../websocket.service';

@Injectable({ providedIn: 'root' })
export class LogReaderService {
  public logEvents = new EventEmitter<Log[]>();

  private worker: Worker | undefined;
  public directory?: FileSystemDirectoryHandle

  constructor(
    private locationService: LocationService,
    private websocketService: WebsocketService
  ) {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker(new URL('./log-reader.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.handleMessageFromWorker(data);
      };
    } else {
      console.log('worker not supported');
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }

    // Listen for when the logReaderId has changed (aka another tab has started reading the logs)
    websocketService.logReaderIdEvent.subscribe(this.onLogReaderId);
  }

  handleMessageFromWorker(message: {
    event: 'logs';
    text: string;
    character: string;
  }) {
    if (message && message.event === 'logs') {
      this.locationService.sendLocationLogs(message.character, message.text);
    }
  }

  setDirectory(directory: FileSystemDirectoryHandle) {
    if (!this.worker) {
      return;
    }
    if (directory && directory.name) {
      this.directory = directory;
      this.worker.postMessage({ event: 'setDirectory', data: directory });
      this.websocketService.setLogReaderId();
    }
  }

  // If the log reader ID changed, and it's not this tab, stop reading.
  onLogReaderId = (logReaderId: string) => {
    const { socket } = this.websocketService;
    if (socket && socket.id !== logReaderId) {
      this.worker?.postMessage({ event: 'stopReading' });
      this.directory = undefined;
    }
  };
}
