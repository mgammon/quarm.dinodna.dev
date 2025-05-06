import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PriceComponent } from '../../items/price.component/price.component';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../characters/character.service';
import { Item } from '../../items/item.entity';
import { ItemLinkComponent } from '../../items/item-link.component/item-link.component';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

interface InventoryItem {
  item: Item;
  itemName: string;
  count: number;
  slots: { [character: string]: string };
}

// - Search by item ID, too!
@Component({
  selector: 'app-inventory-list',
  standalone: true,
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss',
  imports: [
    FormsModule,
    PriceComponent,
    TooltipModule,
    CommonModule,
    ItemLinkComponent,
    TableModule,
    TagModule,
  ],
})
export class InventoryListComponent implements OnInit {
  @Input({ required: false })
  filterText?: string;

  public Array = Array;
  public String = String;
  public list: InventoryItem[] = [];

  constructor(public characterService: CharacterService) {}

  ngOnInit() {
    this.buildList();
    this.characterService.characterChangedEvents.subscribe(() => {
      this.buildList();
    });
  }

  buildList() {
    const itemMap = new Map<number, InventoryItem>();
    this.characterService.characters.forEach((character) => {
      if (!character.inventory) {
        return;
      }

      character.inventory.forEach((inv) => {
        if (!inv.item) {
          return;
        }

        const characterName = inv.slot?.startsWith('SharedBank')
          ? 'Shared Bank'
          : character.name || 'No name';
        const slotName = (inv.slot as string)
          .replace('-', ', ')
          .replace('Slot', 'Slot ')
          .replace('Bank', 'Bank Bag ')
          .replace('General', 'Inventory Bag ')
          .replace('SharedBank', 'Shared Bank Bag ');

        const existing = itemMap.get(inv.item.id);
        if (existing) {
          existing.count += inv.count;
          const existingCharacterSlots = existing.slots[characterName] || '';
          existing.slots[characterName] = [existingCharacterSlots, slotName]
            .join('\n')
            .trim();
        } else {
          itemMap.set(inv.item.id, {
            item: inv.item,
            itemName: inv.item.name,
            count: inv.count,
            slots: { [characterName]: slotName },
          });
        }
      });
    });
    this.list = Array.from(itemMap.values());
  }
}
