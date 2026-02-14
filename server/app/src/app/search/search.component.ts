import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { displayName } from '../utils';
import { Item } from '../items/item.entity';
import { Npc } from '../npcs/npc.entity';
import { ResultComponent } from './result.component/result.component';
import { SearchableEntity, SearchService, SearchType } from './search.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  imports: [CommonModule, AutoCompleteModule, ResultComponent, FormsModule],
})
export class SearchComponent {
  @Input({ required: false })
  types: SearchType[] = [
    SearchType.Item,
    SearchType.Npc,
    SearchType.Spell,
    SearchType.Zone,
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

  public query?: string;

  public displayName = displayName;
  public suggestions: SearchableEntity[] = [];

  constructor(private searchService: SearchService) {}

  async search(event: AutoCompleteCompleteEvent) {
    const { query } = event;
    this.suggestions = await this.searchService.search(
      query,
      10,
      this.types,
      this.itemSearchOptions,
    );
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
