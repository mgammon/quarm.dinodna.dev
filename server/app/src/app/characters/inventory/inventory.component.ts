import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Player } from '../quarm/quarm.character';
import { CharacterService, InventorySlot } from '../character.service';
import { InventorySlotComponent } from '../slots/inventory-slot.component';
import { PriceComponent } from '../../items/price.component/price.component';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';

interface Inventory {
  bank: {
    coins: number;
    bagSlots: (InventorySlot & { slots: InventorySlot[] })[];
  };
  general: {
    coins: number;
    bagSlots: (InventorySlot & { slots: InventorySlot[] })[];
  };
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  imports: [
    FormsModule,
    InventorySlotComponent,
    PriceComponent,
    TooltipModule,
    CommonModule,
  ],
})
export class InventoryComponent implements OnInit {
  @Input({ required: true })
  character!: Player;

  @Input({ required: false })
  hideText: boolean = true;

  public inventory: Inventory | undefined;

  constructor(public characterService: CharacterService) {}

  ngOnInit() {
    this.buildInventory();
    this.characterService.characterChangedEvents.subscribe(
      (updatedCharacter) => {
        if (updatedCharacter.id === this.character.id) {
          this.buildInventory();
        }
      }
    );
  }

  buildInventory() {
    this.inventory = undefined;
    if (!this.character.inventory) {
      return;
    }

    const inventory: Inventory = {
      general: { bagSlots: [], coins: 0 },
      bank: { bagSlots: [], coins: 0 },
    };

    const inventorySlots = this.character.inventory.filter(
      (inv) => inv.slot?.includes('General') || inv.slot?.includes('Bank')
    );

    // Add the bag slots first
    inventorySlots
      .filter((inv) => !inv.slot?.includes('-'))
      .forEach((inv) => {
        if (!inv.slot) {
          return;
        }
        const isGeneral = inv.slot.includes('General');
        const bagSlot = parseInt(inv.slot.slice(inv.slot.length - 1));
        inventory[isGeneral ? 'general' : 'bank'].bagSlots[bagSlot - 1] = {
          ...inv,
          slots: [],
        };
      });

    // Then add the non-bag slots
    this.character.inventory
      .filter((inv) => inv.slot?.includes('-'))
      .forEach((inv) => {
        const isGeneral = inv.slot?.includes('General');
        const isCoinSlot = inv.slot?.includes('-Coin');
        if (isCoinSlot) {
          inventory[isGeneral ? 'general' : 'bank'].coins = inv.count;
        } else {
          const bagSlot = parseInt(
            (isGeneral
              ? inv.slot?.slice(7, 8)
              : inv.slot?.slice(4, 5)) as string
          );
          const bagSlots = inventory[isGeneral ? 'general' : 'bank'].bagSlots;
          if (bagSlots) {
            bagSlots[bagSlot - 1].slots.push(inv);
          }
        }
      });

    this.inventory = inventory;
  }
}
