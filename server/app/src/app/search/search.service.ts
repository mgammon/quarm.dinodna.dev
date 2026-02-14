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

    const [items, npcs, zones, spells] = await Promise.all([
      searchTypes.includes(SearchType.Item)
        ? this.apiService.searchItems(query, itemSearchOptions)
        : [],
      searchTypes.includes(SearchType.Npc)
        ? await this.apiService.searchNpcs(query)
        : [],
      searchTypes.includes(SearchType.Zone)
        ? this.apiService.searchZones(query)
        : [],
      searchTypes.includes(SearchType.Spell)
        ? this.apiService.searchSpells(query)
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
