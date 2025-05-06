import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Player } from '../quarm/quarm.character';
import { CharacterService, InventorySlot } from '../character.service';
import { InventorySlotComponent } from '../slots/inventory-slot.component';
import { PriceComponent } from '../../items/price.component/price.component';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { CharacterSlotComponent } from '../slots/character-slot.component';
import { DividerModule } from 'primeng/divider';

interface Inventory {
  bank: {
    coins: number;
    bagSlots: (InventorySlot & { slots: InventorySlot[] })[];
  };
  general: {
    coins: number;
    bagSlots: (InventorySlot & { slots: InventorySlot[] })[];
  };
  shared: {
    coins: number; // doesn't exist yet, but it may later.
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
    CharacterSlotComponent,
    DividerModule,
  ],
})
export class InventoryComponent implements OnInit, OnChanges {
  @Input({ required: true })
  character!: Player;

  @Input({ required: false })
  hideText: boolean = true;

  @Input({ required: false })
  hideEquipped: boolean = false;

  @Input({ required: false })
  direction: 'row' | 'column' = 'row';

  @Input({ required: false })
  filterText?: string;

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

  ngOnChanges(changes: SimpleChanges) {
    // Character changed
    if (
      changes['character'] &&
      changes['character'].previousValue &&
      changes['character'].currentValue &&
      changes['character'].previousValue?.id !==
        changes['character'].currentValue?.id
    ) {
      console.log('character changed');
      this.buildInventory();
    }
  }

  buildInventory() {
    this.inventory = undefined;
    if (!this.character.inventory) {
      return;
    }

    const inventory: Inventory = {
      general: { bagSlots: [], coins: 0 },
      bank: { bagSlots: [], coins: 0 },
      shared: { bagSlots: [], coins: 0 },
    };

    const inventorySlots = this.character.inventory.filter(
      (inv) =>
        inv.slot?.startsWith('General') ||
        inv.slot?.startsWith('Bank') ||
        inv.slot?.startsWith('SharedBank')
    );

    // Add the bag slots first
    inventorySlots
      .filter((inv) => !inv.slot?.includes('-'))
      .forEach((inv) => {
        if (!inv.slot) {
          return;
        }
        const isGeneral = inv.slot?.includes('General');
        const isShared = inv.slot?.includes('SharedBank');
        // numbers go up to 30 as of this commit (ex: Bank30)
        const bagSlot = parseInt(
          (isGeneral
            ? inv.slot?.slice(7, 9)
            : isShared
            ? inv.slot?.slice(10, 12)
            : inv.slot?.slice(4, 6)) as string
        );
        // Currently only 10 shared bag slots are available, if it changes, this should change
        if (bagSlot > 10 && isShared) {
          return;
        }
        inventory[
          isGeneral ? 'general' : isShared ? 'shared' : 'bank'
        ].bagSlots[bagSlot - 1] = {
          ...inv,
          slots: [],
        };
      });

    // Then add the non-bag slots
    this.character.inventory
      .filter((inv) => inv.slot?.includes('-'))
      .forEach((inv) => {
        const isGeneral = inv.slot?.includes('General');
        const isShared = inv.slot?.includes('SharedBank');
        const isCoinSlot = inv.slot?.includes('-Coin');
        if (isCoinSlot) {
          inventory[
            isGeneral ? 'general' : isShared ? 'shared' : 'bank'
          ].coins = inv.count;
        } else {
          // numbers go up to 30 as of this commit (ex: Bank30-Slot4)
          const bagSlot = parseInt(
            (isGeneral
              ? inv.slot?.slice(7, 9)
              : isShared
              ? inv.slot?.slice(10, 12)
              : inv.slot?.slice(4, 6)) as string
          );
          const bagSlots =
            inventory[isGeneral ? 'general' : isShared ? 'shared' : 'bank']
              .bagSlots;
          if (bagSlots) {
            bagSlots[bagSlot - 1].slots.push(inv);
          }
        }
      });

    console.log(inventory);
    this.inventory = inventory;
  }
}
