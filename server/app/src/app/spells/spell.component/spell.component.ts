import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpellNew } from '../spell.entity';
import {
  buildEffectGeneric,
  EffectDescription,
  getEffectItem,
  getEffectSpell,
  getSpellDurations,
  spellEffectMap,
} from '../spell-effects';
import { ItemLinkComponent } from '../../items/item-link.component/item-link.component';
import { formatTime } from '../../utils';
import { resistTypes, targetTypes } from '../../api/misc';
import { skills } from '../../api/items';
import { classIds } from '../../api/classes';
import { SpellLinkComponent } from '../spell-link.component/spell-link.component';

@Component({
  selector: 'app-spell',
  standalone: true,
  templateUrl: './spell.component.html',
  styleUrl: './spell.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    ItemLinkComponent,
    forwardRef(() => SpellLinkComponent),
  ],
})
export class SpellComponent {
  @Input()
  public spell!: SpellNew;

  @Input()
  public level?: number;

  @Input()
  public levelSource?: string;

  public isFocus?: boolean = false;

  public effectDescriptions: EffectDescription[] = [];

  ngOnChanges() {
    this.effectDescriptions = this.getEffectDescriptions();

    const spellAsAny = this.spell as any;
    const firstEffect = spellEffectMap.get(spellAsAny.effectid1);
    this.isFocus = firstEffect?.effectName?.startsWith('Focus');
  }

  getEffectDescriptions() {
    const spellAsAny = this.spell as any;
    const effectDescriptions: EffectDescription[] = [];
    for (let i = 1; i <= 12; i++) {
      const spellEffect = spellEffectMap.get(spellAsAny[`effectid${i}`]);
      if (spellEffect) {
        const effectDescription = spellEffect.buildEffectDescription
          ? spellEffect.buildEffectDescription(this.spell, i, this.level)
          : { text: buildEffectGeneric(this.spell, i) };
        if (effectDescription && effectDescription.text) {
          effectDescriptions.push(effectDescription);
          effectDescription.spell = getEffectSpell(this.spell, i);
          effectDescription.item = getEffectItem(this.spell, i);
        }
      }
    }
    return effectDescriptions;
  }

  getTargetType() {
    return targetTypes[this.spell.targettype];
  }

  getSkill() {
    return skills[this.spell.skill];
  }

  getResist() {
    return resistTypes[this.spell.resisttype];
  }

  getDuration() {
    const formatDuration = (duration: number, level: number) => {
      const durationString = formatTime(duration * 6 * 1_000, true, true);
      if (durationString === 'Instant') {
        return durationString;
      }
      return `${durationString} at L${level}`;
    };

    const { minLevel, minDuration, maxLevel, maxDuration } = getSpellDurations(
      this.spell,
    );
    const minDurationFormatted = formatDuration(minDuration, minLevel);
    const maxDurationFormatted = formatDuration(maxDuration, maxLevel);

    if (minDuration === maxDuration) {
      return { min: minDurationFormatted, max: null };
    }
    return { min: minDurationFormatted, max: maxDurationFormatted };
  }

  getMinDuration() {
    return this.getDuration().min;
  }

  getMaxDuration() {
    return this.getDuration().max;
  }

  getClasses() {
    let classes: string[] = [];
    for (let i = 1; i <= 16; i++) {
      const className = classIds[i];
      const minLevel: number = (this.spell as any)[`classes${i}`];
      if (minLevel < 255) {
        classes.push(`${className} (${minLevel})`);
      }
    }
    return classes.join(' ');
  }

  public formatTime = formatTime;
}
