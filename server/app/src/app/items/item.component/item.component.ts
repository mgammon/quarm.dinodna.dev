import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Item, buildEffects } from '../item.entity';
import { playableRaceBits } from '../../api/race';
import { ItemEffects } from '../item-effects.component/item-effects.component';
import { PriceComponent } from '../price.component/price.component';
import { bitmaskIncludesBit } from '../../utils';
import { classBits, classIds } from '../../api/classes';
import {
  deityBitmasks,
  drinkDescription,
  foodDescription,
} from '../../api/misc';
import { getSkillFromItemType, itemSizes } from '../../api/items';
import { getSlotsString } from '../../api/slots';

@Component({
  selector: 'app-item',
  standalone: true,
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  imports: [CommonModule, RouterModule, ItemEffects, PriceComponent],
})
export class ItemComponent {
  @Input()
  public item!: Item;

  getSlotsString() {
    return getSlotsString(this.item.slots);
  }

  getItemSize() {
    return itemSizes[this.item.size];
  }

  getBagSize() {
    return itemSizes[this.item.bagsize];
  }

  getSkill() {
    return getSkillFromItemType(this.item);
  }

  getFoodDescription() {
    return foodDescription(this.item);
  }
  getDrinkDescription() {
    return drinkDescription(this.item);
  }

  showCharges(): any {
    const dontShowCharges = [14, 15, 38, 20, 17];
    return (
      this.item.maxcharges > 0 && !dontShowCharges.includes(this.item.itemtype)
    );
  }

  getPlayableRaces(): any {
    const races = this.getPlayableRacesAsStrings(this.item.races);
    if (!races) {
      return null;
    }
    return races.join(' ');
  }

  getClasses(): any {
    if (this.item.scrollEffect) {
      return this.getScrollClasses();
    }
    const classes = this.getClassesAsStrings(this.item.classes);
    if (!classes) {
      return null;
    }
    return classes.join(' ');
  }

  getScrollClasses() {
    let classes: string[] = [];
    for (let i = 1; i <= 16; i++) {
      const className = classIds[i];
      const minLevel: number = (this.item.scrollEffect as any)[`classes${i}`];
      if (minLevel < 255) {
        classes.push(`${className} (${minLevel})`);
      }
    }
    return classes.join(' ');
  }

  getDeity() {
    const deityStrings = this.getDeityAsStrings(this.item.deity);
    if (!deityStrings) {
      return null;
    }
    return deityStrings.join(' ');
  }

  getEffects() {
    return buildEffects(this.item);
  }

  getClassesAsStrings(classesBitmask: number) {
    if (!classesBitmask) {
      return null;
    }
    if (classesBitmask === 32767) {
      return ['ALL']; // All
    }
    const bits = Object.keys(classBits).map((key) => parseInt(key));
    return bits.reduce((strings, bit) => {
      return bitmaskIncludesBit(classesBitmask, bit)
        ? [...strings, classBits[bit]]
        : strings;
    }, [] as string[]);
  }

  getDeityAsStrings(deityValue: number) {
    if (deityValue === 0) {
      return null;
    }

    return Object.keys(deityBitmasks).reduce((strings, deityName) => {
      const bitmask = deityBitmasks[deityName];
      const isMatch = (deityValue & bitmask) === bitmask;
      return isMatch ? [...strings, deityName] : strings;
    }, [] as string[]);
  }

  getPlayableRacesAsStrings(racesBitmask: number) {
    if (!racesBitmask) {
      return null;
    }
    if (racesBitmask === 16383) {
      return ['ALL']; // All bitmask
    }
    const raceBits = Object.keys(playableRaceBits).map((key) => parseInt(key));
    return raceBits.reduce((strings, bit) => {
      return bitmaskIncludesBit(racesBitmask, bit)
        ? [...strings, playableRaceBits[bit]]
        : strings;
    }, [] as string[]);
  }
}
