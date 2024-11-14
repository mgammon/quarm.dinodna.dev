import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Item } from '../../items/item.entity';

import { SearchComponent } from '../../search/search.component';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { ItemLinkComponent } from '../../items/item-link.component/item-link.component';
import { Character, Slot } from '../quarm/quarm.character';
import { ApiService } from '../../api/api.service';
import { isEquippable } from '../quarm/quarm.attack';

@Component({
  selector: 'app-character-slot',
  standalone: true,
  templateUrl: './character-slot.component.html',
  styleUrl: './character-slot.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SearchComponent,
    OverlayPanelModule,
    ItemLinkComponent,
  ],
})
export class CharacterSlotComponent {

  @Input({required: true})
  character!: Character;

  @Input({ required: true })
  slot!: Slot;

  @Input({ required: false })
  hideText!: boolean;

  @Output()
  onItemSelected = new EventEmitter<{ item: Item | undefined; slot: Slot }>();

  constructor(private apiService: ApiService) {}

  isEquippable(){
    return !this.slot.item || isEquippable(this.slot.item, this.character);
  }

  async onSelected(
    item: Item | undefined,
    slot: Slot,
    searchPanel: OverlayPanel
  ) {
    if (item) {
      const fullItem = await this.apiService.getItem(item.id);
      console.log(fullItem, slot);
      this.onItemSelected.emit({ item: fullItem, slot });
    } else {
      this.onItemSelected.emit({ item: undefined, slot });
    }

    searchPanel.hide(); // causes a dumb ExpressionChangedAfterItHasBeenCheckedError, i'll fix it later maybe one day lol probably not
  }
}
