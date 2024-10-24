import { CommonModule, formatNumber, formatPercent } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Item } from '../item.entity';
import { SpellLinkComponent } from '../../spells/spell-link.component/spell-link.component';

interface Effect {
  id: number;
  name: string;
  level: number;
  type?: string;
  castTime?: string | null;
  click?: boolean; // lol lazy but whatever
  worn?: boolean; // lol lazy but whatever
  proc?: boolean; // lol lazy but whatever
  scroll?: boolean; // lol lazy but whatever
}

@Component({
  selector: 'app-item-effects',
  standalone: true,
  templateUrl: './item-effects.component.html',
  styleUrl: './item-effects.component.scss',
  imports: [CommonModule, RouterModule, SpellLinkComponent],
})
export class ItemEffects {
  @Input()
  public item!: Item;

  public effects: Effect[] = [];

  ngOnChanges() {
    this.effects = this.getEffects();
  }

  getEffects() {
    const {
      procEffect,
      proclevel,
      wornEffect,
      wornlevel,
      scrollEffect,
      scrolllevel,
      clickEffect,
      clicklevel,
      clicktype,
    } = this.item;

    const effects: Effect[] = [];
    if (clickEffect) {
      const clickType = clicktype === 4 ? 'Must Equip' : '';
      effects.push({
        id: clickEffect.id,
        name: clickEffect.name,
        level: clicklevel,
        type: clickType,
        castTime: this.getCastTime(),
        click: true,
      });
    }

    if (procEffect && this.item.proceffect !== this.item.worneffect) {
      effects.push({
        id: procEffect.id,
        name: procEffect.name,
        level: proclevel,
        proc: true,
      });
    }

    if (wornEffect) {
      effects.push({
        id: wornEffect.id,
        name: wornEffect.name,
        level: wornlevel,
        worn: true,
      });
    }

    if (scrollEffect) {
      effects.push({
        id: scrollEffect.id,
        name: scrollEffect.name,
        level: scrolllevel,
        castTime: this.getCastTime(),
        scroll: true,
      });
    }

    return effects;
  }

  getCastTime() {
    if (this.item.casttime <= 0) {
      return 'Instant';
    }

    return formatNumber(this.item.casttime / 1000, 'en-US', '1.1-1') + ' sec';
  }

  getLevel(level: number) {
    if (level <= 1 || this.item.legacy_item) {
      return '';
    }
    return `Requires level ${level}`;
  }

  getWornHastePercent() {
    const effectAsAny = this.item.wornEffect as any;
    if (!this.item.wornEffect) {
      return null;
    }

    // Find the index of the haste effect
    let hasteEffectIndex = -1;
    for (let i = 1; i <= 12; i++) {
      const effectId: number = effectAsAny[`effectid${i}`];
      if (effectId === 11) {
        hasteEffectIndex = i;
      }
    }
    if (hasteEffectIndex <= 0) {
      return null;
    }

    const formula = effectAsAny[`formula${hasteEffectIndex}`];
    const effectBase = effectAsAny[`effect_base_value${hasteEffectIndex}`];
    const effectLevel = this.item.wornlevel;

    const effectValue = this.getEffectValue(
      formula,
      effectBase,
      effectLevel,
      -1
    );
    return effectValue ? (effectValue - 100) / 100 : null;
  }

  getEffectValue(
    formula: number,
    effectBase: number,
    effectLevel: number,
    spellLevel: number // idk what this is.
  ) {
    if (formula === 100) {
      return effectBase;
    }
    if (formula === 101) {
      return effectBase + effectLevel / 2;
    }
    if (formula === 102) {
      return effectBase + effectLevel;
    }
    if (formula === 103) {
      return effectBase + effectLevel * 2;
    }
    if (formula === 104) {
      return effectBase + effectLevel * 3;
    }
    if (formula === 105) {
      return effectBase + effectLevel * 4;
    }
    if (formula === 106) {
      return effectBase + effectLevel / 2;
    }
    if (formula === 107) {
      return effectBase + effectLevel / 2;
    }
    if (formula === 108) {
      return effectBase + effectLevel / 3;
    }
    if (formula === 109) {
      return effectBase + effectLevel / 4;
    }
    if (formula === 110) {
      return effectBase + effectLevel / 5;
    }

    return -1;
  }

  getWornHasteText() {
    const hastePercent = this.getWornHastePercent();
    if (!hastePercent) {
      return null;
    }
    return `Haste: ${formatPercent(hastePercent, 'en-US', '1.0-0')}`;
  }

  getParenthesis(effect: Effect) {
    const castTimeText =
      !effect.proc && !effect.worn && !effect.scroll
        ? `Casting Time: ${this.getCastTime()}`
        : null;
    const text = [
      effect.type,
      this.getLevel(effect.worn ? 0 : effect.level),
      castTimeText,
    ]
      .filter((x) => !!x)
      .map((s) => s?.trim())
      .join('. ');
    return text ? `(${text})` : null;
  }
}
