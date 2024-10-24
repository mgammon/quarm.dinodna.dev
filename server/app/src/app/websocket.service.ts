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
  public logReaderIdEvent = new EventEmitter<string>();

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
    this.socket.on('logReaderId', (logReaderId: string) =>
      this.logReaderIdEvent.emit(logReaderId)
    );

    // this.socket.on('connect', () => {
    //   console.log(this.socket);
    // });

    // Connect
    this.socket.connect();
  }

  sendLocationLogs(message: { character: string; logs: string[] }) {
    if (message && message.logs && message.logs.length && this.socket) {
      this.socket.emit('location', message);
    }
  }

  // Called when we start reading logs for this tab; its ID will be sent to the other tabs so they stop reading.
  setLogReaderId() {
    this.socket?.emit('logReaderId');
  }
}
