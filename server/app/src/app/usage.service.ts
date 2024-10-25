import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class UsageService {
  constructor(private websocketService: WebsocketService) {}

  send(event: string) {
    this.websocketService.socket?.emit('usage', event);
  }
}
