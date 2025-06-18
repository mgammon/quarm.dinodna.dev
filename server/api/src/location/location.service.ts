import { Injectable } from '@nestjs/common';
import { ZoneService } from '../zones/zone.service';

interface Location {
  character?: string;
  coords?: { x: number; y: number; z: number };
  heading?: number;
  zoneId?: string;
  updatedAt?: number;
}

@Injectable()
export class LocationService {
  private locations = new Map<string, Location>();

  constructor(private zoneService: ZoneService) {}

  isLocationLog(line: string) {
    return /(Your Location is )/.test(line);
  }

  isZoneLog(line: string) {
    return /(You have entered )/.test(line);
  }

  onLocation(locationLogs: string[], character: string, apiKey: string) {
    for (const locationLog of locationLogs) {
      if (this.isZoneLog(locationLog)) {
        return this.processZoneLog(locationLog, character, apiKey);
      } else if (this.isLocationLog(locationLog)) {
        return this.processLocationLog(locationLog, character, apiKey);
      }
    }
  }

  getOrCreateLocation(apiKey: string) {
    return this.locations.get(apiKey) || this.locations.set(apiKey, {}).get(apiKey);
  }

  processLocationLog(locationLog: string, character: string, apiKey: string) {
    const newCoords = this.parseCoords(locationLog);
    const currentLocation = this.getOrCreateLocation(apiKey);

    // Calculate heading if we have previous coords
    let heading = 0;
    if (currentLocation && currentLocation.coords) {
      const previousCoords = currentLocation.coords;
      const deltaX = newCoords.x - previousCoords.x;
      const deltaY = newCoords.y - previousCoords.y;
      const radians = Math.atan2(deltaY, deltaX);
      heading = Math.round(radians * (180 / Math.PI));
    }

    // Set updated values
    currentLocation.coords = newCoords;
    currentLocation.heading = heading;
    currentLocation.updatedAt = Date.now();
    currentLocation.character = character;
    return currentLocation;
  }

  // [Sun Jul 21 21:25:59 2024] Your Location is 1631.18, 859.01, 60.59
  parseCoords(locationLog: string): { x: number; y: number; z: number } {
    const coordString = locationLog.split('] Your Location is ')[1];
    const [y, x, z] = coordString.split(', ').map((s) => parseFloat(s));
    return { x, y, z };
  }

  // [Sun Jul 21 21:26:12 2024] You have entered Oggok.
  processZoneLog(zoneLog: string, character, apiKey) {
    // Find the zone shortName
    const zoneString = zoneLog.split('] You have entered ')[1].replace('.', '').replace('\r', '');
    const zone = this.zoneService.zones.find((zone) => zone.long_name === zoneString);

    // Update zone
    const currentLocation = this.getOrCreateLocation(apiKey);
    currentLocation.zoneId = zone?.short_name;
    currentLocation.character = character;
    currentLocation.updatedAt = Date.now();
    return currentLocation;
  }
}
