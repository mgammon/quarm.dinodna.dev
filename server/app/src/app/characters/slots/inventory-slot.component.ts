import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
export class InventorySlotComponent {
  @Input({ required: true })
  character!: Character;

  @Input({ required: true })
  slot!: InventorySlot;

  @Input({ required: false })
  hideText!: boolean;
}
