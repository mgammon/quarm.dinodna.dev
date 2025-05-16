import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api/api.service';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { displayName } from '../utils';
import { Item } from '../items/item.entity';
import { Npc } from '../npcs/npc.entity';
import { ResultComponent } from './result.component/result.component';
import { Zone } from '../zones/zone.entity';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  imports: [CommonModule, AutoCompleteModule, ResultComponent],
})
export class SearchComponent {
  @Input({ required: false })
  types: ('items' | 'zones' | 'npcs')[] = ['items', 'zones', 'npcs'];

  @Input({ required: false })
  skipNavigation?: boolean = false;

  @Input({ required: false })
  placeholder: string = 'Search';

  @Input({ required: false })
  itemSearchOptions?: {
    slots?: number[];
    classes?: number[];
    races?: number[];
  };

  @Output()
  onItemSelected = new EventEmitter<Item>();

  @Output()
  onNpcSelected = new EventEmitter<Npc>();

  public displayName = displayName;
  public suggestions: (Item | Npc | Zone)[] = [];

  constructor(private apiService: ApiService, private router: Router) {}

  async search(event: AutoCompleteCompleteEvent) {
    const { query } = event;

    const [items, npcs, zones] = await Promise.all([
      this.types.includes('items')
        ? this.apiService.searchItems(query, this.itemSearchOptions)
        : [],
      this.types.includes('npcs')
        ? await this.apiService.searchNpcs(query)
        : [],
      this.types.includes('zones') ? this.apiService.searchZones(query) : [],
    ]);

    // lazy but idk
    zones.forEach((zone) => ((zone as any).name = zone.long_name));

    this.suggestions = [...items, ...npcs, ...zones].sort(
      (a, b) => (b.relevance || 0) - (a.relevance || 0)
    );
  }

  onSelect($event: AutoCompleteSelectEvent) {
    const entity = $event.value;
    if (this.isItem(entity)) {
      this.onItemSelected.emit(entity);
      this.navigate(`items/${entity.id}`);
    } else if (this.isNpc(entity)) {
      this.navigate(`npcs/${entity.id}`);
      this.onNpcSelected.emit(entity);
    } else if (this.isZone(entity)) {
      this.navigate(`zones/${entity.short_name}`);
    }
  }

  navigate(url: string) {
    if (this.skipNavigation) {
      return;
    }
    this.router.navigateByUrl(url);
  }

  isItem(entity: Item | Npc | Zone) {
    return Object.hasOwn(entity, 'itemtype');
  }

  isNpc(entity: Item | Npc | Zone) {
    return Object.hasOwn(entity, 'spawnEntries');
  }

  isZone(entity: Item | Npc | Zone) {
    return Object.hasOwn(entity, 'short_name');
  }

  goTo(name: string, url: string) {}
}
