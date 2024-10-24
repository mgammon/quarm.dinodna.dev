import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private store = new Map<string, any>();

  set<T>(key: string, data: T, localStorage = false) {
    this.store.set(key, data);
  }

  get<T>(key: string): T {
    return this.store.get(key) as T;
  }
}
