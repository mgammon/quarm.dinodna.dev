import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapStore {
  public markedSpawnIds = new BehaviorSubject<number[] | undefined>(undefined);
}
