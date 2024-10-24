import { EventEmitter, Injectable } from '@angular/core';
import { Log } from './log.entity';
import { LocationService } from './location.service';
import { WebsocketService } from '../websocket.service';
import * as localforage from 'localforage';

@Injectable({ providedIn: 'root' })
export class LogReaderService {
  public logEvents = new EventEmitter<Log[]>();

  private worker: Worker | undefined;
  public directory?: FileSystemDirectoryHandle;
  public isReading = false;
  public hasPermissions = false;
  public logReaderIdQueue: string[] = [];

  constructor(
    private locationService: LocationService,
    private websocketService: WebsocketService
  ) {
    this.loadDirectoryHandleFromIndexedDb();

    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker(new URL('./log-reader.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.handleMessageFromWorker(data);
      };
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }

    // Listen for when the logReaderId has changed (aka another tab has started reading the logs)
    websocketService.logReaderStartEvent.subscribe(this.onLogReaderStart);
    websocketService.logReaderStopEvent.subscribe(this.onLogReaderStop);
  }

  async loadDirectoryHandleFromIndexedDb() {
    const savedDirectory: FileSystemDirectoryHandle | null =
      await localforage.getItem('eqDirectoryHandle');
    if (savedDirectory) {
      this.setDirectory(savedDirectory);
    }
  }

  async verifyReadPermission(
    directoryHandle: FileSystemDirectoryHandle & {
      queryPermission: () => Promise<string>;
      requestPermission: () => Promise<string>;
    }
  ) {
    try {
      if ((await directoryHandle.queryPermission()) === 'granted') {
        return true;
      }

      if ((await directoryHandle.requestPermission()) === 'granted') {
        return true;
      }
    } catch (ex) {
      return false;
    }

    return false;
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

  async setDirectory(directory: FileSystemDirectoryHandle) {
    // No worker
    if (!this.worker) {
      return;
    }
    // No directory picked
    if (!directory || !directory.name) {
      return;
    }
    // No permissions on the directory
    this.hasPermissions = await this.verifyReadPermission(directory as any);
    if (!this.hasPermissions) {
      return;
    }

    this.directory = directory;
    localforage.setItem('eqDirectoryHandle', directory);
    this.worker.postMessage({ event: 'setDirectory', data: directory });
    this.isReading = true;
    this.websocketService.startedLogReader();
  }

  onLogReaderStop = (disconnectedSocketId: string) => {
    // No active log reader yet, nothing to do
    const activeLogReaderId =
      this.logReaderIdQueue[this.logReaderIdQueue.length - 1];
    if (!activeLogReaderId) {
      return;
    }

    const thisLogReaderId = this.directory && this.websocketService.socket?.id;
    const thisIsTheDisconnectedReader =
      disconnectedSocketId === thisLogReaderId;
    const thisIsTheActiveLogReader = activeLogReaderId === thisLogReaderId;
    // This was the active log reader, but it disconnected
    if (thisIsTheActiveLogReader && thisIsTheDisconnectedReader) {
      this.stopReading();
    }

    // Remove the disconnected reader from the queue
    this.logReaderIdQueue = this.logReaderIdQueue.filter(
      (id) => id !== disconnectedSocketId
    );

    // If the active reader disconnected, and this one is next up, start reading here.
    const nextUpLogReaderId =
      this.logReaderIdQueue[this.logReaderIdQueue.length - 1];
    const activeLogReaderStopped = disconnectedSocketId === activeLogReaderId;
    if (
      activeLogReaderStopped &&
      thisLogReaderId === nextUpLogReaderId &&
      this.directory
    ) {
      this.setDirectory(this.directory);
    }
  };

  stopReading = () => {
    this.worker?.postMessage({ event: 'stopReading' });
    this.isReading = false;
  };

  // If the log reader ID changed, and it's not this tab, stop reading.
  onLogReaderStart = (logReaderId: string) => {
    const { socket } = this.websocketService;

    // Add this to the queue if it's not already there
    if (!this.logReaderIdQueue.includes(logReaderId)) {
      this.logReaderIdQueue.push(logReaderId);
    }

    if (socket && socket.id !== logReaderId) {
      this.stopReading();
    }
  };
}
