import { EventEmitter, Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Location } from './log.entity';

export type CurrentLocation =
  | {
      coords?: { x: number; y: number; z: number };
      heading?: number;
      zoneId?: string;
    }
  | undefined;

@Injectable({ providedIn: 'root' })
export class LocationService {
  public autoLoadZone: boolean = true;
  public autoCenter: boolean = true;

  public currentLocation: Location = {};
  public locationEvents = new EventEmitter<Location>();

  constructor(private websocketService: WebsocketService) {
    websocketService.locationEvents.subscribe(this.onLocation);
  }

  public onLocation = (location: Location) => {
    this.currentLocation = location;
    this.currentLocation.coords = location.coords;
    this.currentLocation.heading = location.heading;
    this.currentLocation.zoneId = location.zoneId;
    this.currentLocation.updatedAt = location.updatedAt;
    localStorage.setItem('lastZoneId', location.zoneId || '');
    this.locationEvents.emit(location);
  };

  public sendLocationLogs(character: string, rawLogs: string) {
    if (!rawLogs || !rawLogs.trim().length) {
      return;
    }
    const locationLogs = rawLogs
      .split(/\n+/)
      .filter((log) => this.isLocationLog(log) || this.isZoneLog(log));

    if (locationLogs && locationLogs.length) {
      const message = { logs: locationLogs, character };
      this.websocketService.sendLocationLogs(message);
    }
  }

  private isLocationLog(line: string) {
    return /(Your Location is )/.test(line);
  }

  private isZoneLog(line: string) {
    return /(You have entered )/.test(line);
  }
}
