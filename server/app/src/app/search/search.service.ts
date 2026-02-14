import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Item } from '../items/item.entity';
import { Npc } from '../npcs/npc.entity';
import { Zone } from '../zones/zone.entity';
import { SpellNew } from '../spells/spell.entity';
import { Router } from '@angular/router';

export enum SearchType {
  Item = 'item',
  Zone = 'zone',
  Npc = 'npc',
  Spell = 'spell',
}

export type SearchableEntity = Item | Npc | Zone | SpellNew;

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  async search(
    query: string,
    size: number,
    searchTypes?: SearchType[],
    itemSearchOptions?: {
      slots?: number[];
      classes?: number[];
      races?: number[];
    },
  ): Promise<SearchableEntity[]> {
    if (!searchTypes) {
      searchTypes = [
        SearchType.Item,
        SearchType.Zone,
        SearchType.Npc,
        SearchType.Spell,
      ];
    }

    if (!query || query.length < 2) {
      return [];
    }

    let querySearchTypes = searchTypes;
    query = query.toLowerCase();
    if (query.startsWith('zone:') || query.startsWith('z:')) {
      querySearchTypes = [SearchType.Zone];
      query = query.replace('zone:', '').replace('z:', '').trim();
    } else if (query.startsWith('npc:') || query.startsWith('n:')) {
      querySearchTypes = [SearchType.Npc];
      query = query.replace('npc:', '').replace('n:', '').trim();
    } else if (query.startsWith('item:') || query.startsWith('i:')) {
      querySearchTypes = [SearchType.Item];
      query = query.replace('item:', '').replace('i:', '').trim();
    } else if (query.startsWith('spell') || query.startsWith('s:')) {
      querySearchTypes = [SearchType.Spell];
      query = query.replace('spell:', '').replace('s:', '').trim();
    }

    const [items, npcs, zones, spells] = await Promise.all([
      querySearchTypes.includes(SearchType.Item)
        ? this.apiService.searchItems(query, itemSearchOptions, 0, size)
        : [],
      querySearchTypes.includes(SearchType.Npc)
        ? await this.apiService.searchNpcs(query, 0, size)
        : [],
      querySearchTypes.includes(SearchType.Zone)
        ? this.apiService.searchZones(query, 0, size)
        : [],
      querySearchTypes.includes(SearchType.Spell)
        ? this.apiService.searchSpells(query, 0, size)
        : [],
    ]);

    // lazy but idk
    zones.forEach((zone) => ((zone as any).name = zone.long_name));

    const results = [...items, ...npcs, ...zones, ...spells].sort(
      (a, b) => (b.relevance || 0) - (a.relevance || 0),
    );

    return results;
  }

  isItem(entity: SearchableEntity) {
    return Object.hasOwn(entity, 'itemtype');
  }

  isNpc(entity: SearchableEntity) {
    return Object.hasOwn(entity, 'spawnEntries');
  }

  isZone(entity: SearchableEntity) {
    return Object.hasOwn(entity, 'short_name');
  }

  isSpell(entity: SearchableEntity) {
    return Object.hasOwn(entity, 'you_cast');
  }

  navigateToEntity(entity: SearchableEntity) {
    if (this.isItem(entity)) {
      this.router.navigateByUrl(`items/${entity.id}`);
    } else if (this.isNpc(entity)) {
      this.router.navigateByUrl(`npcs/${entity.id}`);
    } else if (this.isZone(entity)) {
      this.router.navigateByUrl(`zones/${(entity as Zone).short_name}`);
    } else if (this.isSpell(entity)) {
      this.router.navigateByUrl(`spells/${entity.id}`);
    }
  }
}
