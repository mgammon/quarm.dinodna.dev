import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

import { SearchComponent } from '../../search/search.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ItemLinkComponent } from '../../items/item-link.component/item-link.component';
import { Character } from '../quarm/quarm.character';
import { InventorySlot } from '../character.service';

@Component({
  selector: 'app-inventory-slot',
  standalone: true,
  templateUrl: './inventory-slot.component.html',
  styleUrl: './inventory-slot.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SearchComponent,
    OverlayPanelModule,
    ItemLinkComponent,
  ],
})
export class InventorySlotComponent implements OnInit {
  public subtitle?: string;
  ngOnInit(): void {
    if (this.slot.slot) {
      const characterName = `${this.character.name || 'No name'}`;
      const slotName = this.slot.slot
        .replace('-', ', ')
        .replace('Slot', 'Slot ')
        .replace('Bank', 'Bank Bag ')
        .replace('General', 'Inventory Bag ');
      this.subtitle = `${characterName}, ${slotName}`;
    }
  }

  @Input({ required: true })
  character!: Character;

  @Input({ required: false })
  filterText?: string;

  @Input({ required: true })
  slot!: InventorySlot;

  @Input({ required: false })
  hideText!: boolean;

  @Input({ required: false })
  scale!: number;
}
