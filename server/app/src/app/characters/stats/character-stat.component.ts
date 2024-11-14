import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

import { AllocatableStat, Player } from '../quarm/quarm.character';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-character-stat',
  standalone: true,
  templateUrl: './character-stat.component.html',
  styleUrl: './character-stat.component.scss',
  imports: [CommonModule, FormsModule, ButtonModule, TooltipModule],
})
export class CharacterStatComponent {
  @Input({ required: true })
  character!: Player;

  @Input({ required: true })
  stat!: AllocatableStat;

  @Output()
  onChange = new EventEmitter<void>();

  plusDown = false;
  minusDown = false;

  public altKey = false;

  get canDecrement() {
    return (
      this.character.owned && 
      this.character.allocatedStats &&
      this.character.allocatedStats[this.stat] > 0
    );
  }

  get canIncrement() {
    return (
      this.character.owned && 
      this.character.allocatedStats &&
      this.character.allocatedStats[this.stat] < 25 &&
      this.character.unallocatedStatPoints > 0
    );
  }

  tooltip() {
    if (!this.character.allocatedStats) {
      return;
    }
    const base = this.character.baseStats[this.stat];
    const startingPoints = this.character.allocatedStats[this.stat];
    const items = this.character.itemBonuses[this.stat];

    let tooltip = base + ' base';
    if (startingPoints) {
      tooltip += '\n' + startingPoints + ' starting points';
    }
    if (items) {
      tooltip += '\n' + items + ' from items';
    }

    return tooltip;
  }

  decrement() {
    if (this.canDecrement) {
      this.character.allocatedStats[this.stat]--;
      this.character.unallocatedStatPoints++;
      this.character.calcStats();
      this.onChange.emit();
    }
  }

  increment() {
    if (this.canIncrement) {
      this.character.allocatedStats[this.stat]++;
      this.character.unallocatedStatPoints--;
      this.character.calcStats();
      this.onChange.emit();
    }
  }
}
