import { EventEmitter, Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Location, Log } from './logs/log.entity';
import { ApiService } from './api/api.service';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  public socket?: Socket;

  public locationEvents = new EventEmitter<Location>();
  public logEvents = new EventEmitter<Log[]>();
  public logReaderStartEvent = new EventEmitter<string>();
  public logReaderStopEvent = new EventEmitter<string>();
  public socketConnect = new EventEmitter<string>();

  constructor(apiService: ApiService) {
    // Create the socket
    this.socket = io(apiService.baseUrl, {
      auth: { app: apiService.apiKey },
      path: '/api/ws',
    });

    // Listen for logs and location messages
    this.socket.on('logs', (logs: Log[]) => this.logEvents.emit(logs));
    this.socket.on('location', (location: Location) =>
      this.locationEvents.emit(location)
    );
    // Listen for if another tab has started reading logs
    this.socket.on('logReaderStart', (logReaderId: string) =>
      this.logReaderStartEvent.emit(logReaderId)
    );
    // Listen if another tab POTENTIALLY stopped reading logs.  Sent to all tabs when a socket disconnects.
    this.socket.on('logReaderStop', (logReaderId) => {
      this.logReaderStopEvent.emit(logReaderId);
    });

    // Connect
    this.socket.connect();
  }

  sendLocationLogs(message: { character: string; logs: string[] }) {
    if (message && message.logs && message.logs.length && this.socket) {
      this.socket.emit('location', message);
    }
  }

  // Called when we start reading logs for this tab; its ID will be sent to the other tabs so they stop reading.
  startedLogReader() {
    this.socket?.emit('logReaderStart');
  }
}
