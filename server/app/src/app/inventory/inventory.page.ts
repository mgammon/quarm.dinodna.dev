import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Player } from '../characters/quarm/quarm.character';
import { CharacterService } from '../characters/character.service';
import { InventorySlotComponent } from '../characters/slots/inventory-slot.component';
import { PriceComponent } from '../items/price.component/price.component';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { InventoryComponent } from '../characters/inventory/inventory.component';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss',
  imports: [
    FormsModule,
    InventorySlotComponent,
    PriceComponent,
    TooltipModule,
    CommonModule,
    InventoryComponent,
    AccordionModule,
    ButtonModule,
    SelectButtonModule,
    AutoCompleteModule,
    InventoryListComponent,
    CardModule,
    ProgressSpinnerModule,
  ],
})
export class InventoryPage {
  public activeIndex: number[] = [];
  constructor(public characterService: CharacterService) {
    this.loadViewAs();
  }

  viewAs!: 'grid' | 'list';
  viewAsOptions = ['grid', 'list'];
  public loading = true;

  async ngOnInit() {
    await this.characterService.loadMyCharacters();
    this.activeIndex = this.characterService.characters.map((c, i) => i);
    this.initializeItems();
    this.loading = false;
  }

  get hasNoInventory() {
    return (
      !this.characterService.characters.length ||
      this.characterService.characters.every(
        (c) => !c.inventory || !c.inventory.length
      )
    );
  }

  initializeItems() {
    const itemsSet = new Set<string>();
    this.characterService.characters.forEach((character) => {
      if (!character.inventory) {
        return;
      }
      character.inventory
        .filter((inv) => inv.item)
        .forEach((inv) => itemsSet.add(inv.item!.name));
    });
    this.items = Array.from(itemsSet.values());
  }

  async importFromZeal($event: any) {
    const charactersLength = this.characterService.characters.length;
    await this.characterService.onZealInventoryFileEvent($event);
    const newCharacterIndexes = this.characterService.characters
      .map((c, i) => i)
      .slice(charactersLength);
    if (newCharacterIndexes.length) {
      console.log(newCharacterIndexes);
      this.activeIndex.push(...newCharacterIndexes);
    }
    this.initializeItems();
  }

  activeIndexChange(index: any) {
    this.activeIndex = index;
  }

  async deleteCharacter(character: Player) {
    const index = this.characterService.characters.findIndex(
      (c) => c.id === character.id
    );
    if (index > -1) {
      this.activeIndex = this.activeIndex.filter((i) => i !== index);
    }
    await this.characterService.deletePlayer(character.id);
    this.initializeItems();
  }

  loadViewAs() {
    this.viewAs = (localStorage.getItem('inventoryViewAs') || 'grid') as
      | 'grid'
      | 'list';
  }

  saveViewAs() {
    localStorage.setItem('inventoryViewAs', this.viewAs);
  }

  public filterText = '';
  private items: string[] = [];
  public suggestions: string[] = [];
  search() {
    this.suggestions = this.items
      .filter((item) =>
        item.toLowerCase().includes(this.filterText.toLowerCase().trim())
      )
      .sort((a, b) => a.length - b.length)
      .slice(0, 10);
  }
}
