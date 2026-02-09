import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, take } from 'rxjs';
import { Item } from '../items/item.entity';
import { Npc, SpawnEntry } from '../npcs/npc.entity';
import { SpellNew } from '../spells/spell.entity';
import { ItemSearchOptions } from '../items/item-search.page/item-search.page';
import { NpcSearchOptions } from '../npcs/npc-search.page/npc-search.page';
import { Zone } from '../zones/zone.entity';
import { Log } from '../logs/log.entity';
import { environment } from '../../environments/environment';
import { CharacterDto } from '../characters/character.service';
import { ItemTrackerDto } from '../auctions/tracker/tracker.service';

const LOCAL_STORAGE_CACHE_ENABLED = false;

class Cache<T> {
  private map: Map<number | string, T>;

  constructor(private localStorageKey: string) {
    const json = localStorage.getItem(localStorageKey);
    this.map = new Map<number, T>(json ? JSON.parse(json) : null);
  }

  get(id: number | string): T | null {
    return this.map.get(id) || null;
  }

  set(id: number | string, entity: T) {
    this.map.set(id, entity);
    this.save();
  }

  private save() {
    if (LOCAL_STORAGE_CACHE_ENABLED) {
      localStorage.setItem(
        this.localStorageKey,
        JSON.stringify([...this.map.entries()]),
      );
    }
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private cache = {
    items: new Cache<Item>('items'),
    itemSnippets: new Cache<Item>('item-snippets'),
    npcs: new Cache<Npc>('npcs'),
    spells: new Cache<SpellNew>('spells'),
    zones: new Cache<Zone>('zones'),
    mapfiles: new Cache<string>('mapfiles'),
  };

  public apiKey?: string;
  public baseUrl = environment.production
    ? `https://${window.location.host}`
    : 'http://localhost:3000';
  private apiUrl = this.baseUrl + '/api';

  constructor(private http: HttpClient) {
    this.setApiKey();
  }

  public changeApiKey(key: string) {
    if (!key || key.length < 15) {
      return;
    }

    this.apiKey = key;
    localStorage.setItem('apiKey', this.apiKey);
  }

  private setApiKey() {
    this.apiKey = localStorage.getItem('apiKey') || this.generateApiKey();
    if (this.apiKey === 'null' || !this.apiKey) {
      this.apiKey = this.generateApiKey();
    }
    localStorage.setItem('apiKey', this.apiKey);
    this.apiKey = localStorage.getItem('apiKey') as string;
  }

  private generateApiKey() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 16) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  private toPromise<T>(observableRequest: Observable<T>) {
    return lastValueFrom<T>(observableRequest.pipe(take(1)));
  }

  async getItem(itemId: number, includeAuctions = false) {
    // Try to get from the cache
    const cached = this.cache.items.get(itemId);
    if (cached && (cached.dailyAuctions || !includeAuctions)) {
      return cached;
    }

    // Or get it from the API and cache it
    const item = await this.toPromise(
      this.http.get<Item>(`${this.apiUrl}/items/${itemId}`, {
        params: { includeAuctions },
      }),
    );
    this.cache.items.set(item.id, item);
    return item;
  }

  async getItemSnippets(itemIds: number[]) {
    // Or get it from the API and cache it
    return this.toPromise(
      this.http.get<Item[]>(`${this.apiUrl}/items`, {
        params: { ids: itemIds },
      }),
    );
  }

  async getItemSnippet(itemId: number) {
    // Try to get from the cache
    const cached = this.cache.itemSnippets.get(itemId);
    if (cached) {
      return cached;
    }

    // Or get it from the API and cache it
    const item = await this.toPromise(
      this.http.get<Item>(`${this.apiUrl}/items/${itemId}/snippet`),
    );
    this.cache.itemSnippets.set(item.id, item);
    return item;
  }

  async getZone(shortName: string) {
    // Try to get from the cache
    const cached = this.cache.zones.get(shortName);
    if (cached) {
      return cached;
    }

    // Or get it from the API and cache it
    const zone = await this.toPromise(
      this.http.get<Zone>(`${this.apiUrl}/zones/${shortName}`),
    );
    this.cache.zones.set(zone.short_name, zone);
    return zone;
  }

  async getMapfile(fileName: string) {
    // Try to get from the cache
    const cached = this.cache.mapfiles.get(fileName);
    if (cached) {
      return cached;
    }

    // Or get it from the API and cache it
    let mapfile = await this.toPromise(
      this.http.get<string>(`/assets/mapfiles/${fileName}.txt`, {
        responseType: 'text' as any,
      }),
    );
    const mapfileDetails = await this.toPromise(
      this.http.get<string>(`/assets/mapfiles/${fileName}_1.txt`, {
        responseType: 'text' as any,
      }),
    );
    mapfile = [mapfile, mapfileDetails].join('\n');

    this.cache.mapfiles.set(fileName, mapfile);
    return mapfile;
  }

  searchItems(
    search: string,
    options:
      | { slots?: number[]; classes?: number[]; races?: number[] }
      | undefined,
    page = 0,
    size = 10,
  ) {
    return this.toPromise(
      this.http.get<Item[]>(`${this.apiUrl}/items/search/${search}`, {
        params: { page, size, ...options },
      }),
    );
  }

  async complexItemSearch(options: ItemSearchOptions) {
    return this.toPromise(
      this.http.post<Item[]>(`${this.apiUrl}/items/search/`, options),
    );
  }

  complexNpcSearch(options: NpcSearchOptions) {
    return this.toPromise(
      this.http.post<Npc[]>(`${this.apiUrl}/npcs/search/`, options),
    );
  }

  async getNpc(npcId: number) {
    // Try to get from the cache
    const cached = this.cache.npcs.get(npcId);
    if (cached) {
      return cached;
    }

    // Or get it from the API and cache it
    const npc = await this.toPromise(
      this.http.get<Npc>(`${this.apiUrl}/npcs/${npcId}`),
    );
    this.cache.npcs.set(npc.id, npc);
    return npc;
  }

  searchNpcs(search: string, page = 0, size = 10) {
    return this.toPromise(
      this.http.get<Npc[]>(`${this.apiUrl}/npcs/search/${search}`, {
        params: { page, size },
      }),
    );
  }

  async getSpawnEntries(spawnGroupIds: number[]) {
    // Try to get from the cache
    // const cached = this.cache.zones.get(shortName);
    // if (cached) {
    //   return cached;
    // }

    // Or get it from the API and cache it
    const spawnEntries = await this.toPromise(
      this.http.get<SpawnEntry[]>(`${this.apiUrl}/npcs/spawn-entries`, {
        params: { spawnGroupIds: spawnGroupIds.join(',') },
      }),
    );
    // this.cache.zones.set(zone.short_name, zone);
    return spawnEntries;
  }

  async getSpell(spellId: number) {
    // Try to get from the cache
    const cached = this.cache.spells.get(spellId);
    if (cached) {
      return cached;
    }

    // Or get it from the API and cache it
    const spell = await this.toPromise(
      this.http.get<SpellNew>(`${this.apiUrl}/spells/${spellId}`),
    );
    this.cache.spells.set(spell.id, spell);
    return spell;
  }

  async getSpellSnippet(spellId: number) {
    throw new Error('Not implemented!');
  }

  async getAllZones(): Promise<Zone[]> {
    return this.toPromise(this.http.get<Zone[]>(`${this.apiUrl}/zones`));
  }

  searchZones(search: string, page = 0, size = 10) {
    return this.toPromise(
      this.http.get<Zone[]>(`${this.apiUrl}/zones/search/${search}`, {
        params: { page, size },
      }),
    );
  }

  // Not cached!  Could be in logs service I guess
  getLogs(beforeLog?: Log) {
    const before = beforeLog ? beforeLog.sentAt.valueOf : Date.now();
    return this.toPromise(
      this.http.get<Log[]>(`${this.apiUrl}/logs/${before}`),
    );
  }

  async getMaxSkills(classId: number, level: number) {
    return this.toPromise(
      this.http.get<{ skillId: number; value: number }[]>(
        `${this.apiUrl}/player/max-skills/${classId}/${level}`,
      ),
    );
  }

  async sendFeedback(feedback: { name: string; message: string }) {
    return this.toPromise(
      this.http.post<void>(`${this.apiUrl}/feedback`, feedback, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  /* ----------
  // Characters
  -----------*/
  async createCharacter(character: Partial<CharacterDto>) {
    return this.toPromise(
      this.http.post<CharacterDto>(`${this.apiUrl}/characters/`, character, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  async updateCharacter(character: Partial<CharacterDto>) {
    return this.toPromise(
      this.http.patch<CharacterDto>(
        `${this.apiUrl}/characters/${character.id}`,
        character,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      ),
    );
  }

  async deleteCharacter(id: number) {
    return this.toPromise(
      this.http.delete<CharacterDto>(`${this.apiUrl}/characters/${id}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  async getCharacters() {
    return this.toPromise(
      this.http.get<CharacterDto[]>(`${this.apiUrl}/characters/`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  async getCharacter(id: number) {
    return this.toPromise(
      this.http.get<CharacterDto>(`${this.apiUrl}/characters/${id}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  async getItemTrackers() {
    return this.toPromise(
      this.http.get<ItemTrackerDto[]>(`${this.apiUrl}/item-trackers/`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  async createItemTracker(itemTrackerDto: ItemTrackerDto) {
    return this.toPromise(
      this.http.post<ItemTrackerDto>(
        `${this.apiUrl}/item-trackers/`,
        itemTrackerDto,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      ),
    );
  }

  async deleteItemTracker(id: number) {
    return this.toPromise(
      this.http.delete<void>(`${this.apiUrl}/item-trackers/${id}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    );
  }

  async updateItemTracker(itemTrackerDto: ItemTrackerDto) {
    return this.toPromise(
      this.http.put<ItemTrackerDto>(
        `${this.apiUrl}/item-trackers/${itemTrackerDto.id}`,
        itemTrackerDto,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      ),
    );
  }
}
