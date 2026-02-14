import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { displayName } from '../../utils';
import { Item } from '../../items/item.entity';
import { Npc } from '../../npcs/npc.entity';
import { ResultComponent } from '../result.component/result.component';
import { Zone } from '../../zones/zone.entity';
import { SpellNew } from '../../spells/spell.entity';
import { SearchableEntity, SearchService } from '../search.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
  imports: [CommonModule, AutoCompleteModule, ResultComponent],
})
export class SearchPageComponent {
  @Input({ required: false })
  types: ('items' | 'zones' | 'npcs' | 'spells')[] = [
    'items',
    'zones',
    'npcs',
    'spells',
  ];

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
  public suggestions: (Item | Npc | Zone | SpellNew)[] = [];

  constructor(private searchService: SearchService) {}

  async search(event: AutoCompleteCompleteEvent) {
    const { query } = event;
    this.suggestions = await this.searchService.search(query);
  }

  onSelect($event: AutoCompleteSelectEvent) {
    const entity = $event.value;
    if (this.searchService.isItem(entity)) {
      this.onItemSelected.emit(entity);
    } else if (this.searchService.isNpc(entity)) {
      this.onNpcSelected.emit(entity);
    }

    this.navigate(entity);
  }

  navigate(entity: SearchableEntity) {
    if (this.skipNavigation) {
      return;
    }
    this.searchService.navigateToEntity(entity);
  }
}
