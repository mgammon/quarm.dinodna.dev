import { formatPercent } from '@angular/common';
import { EntitySummary, SpellNew } from './spell.entity';
import { formatTime } from '../utils';

// TODO:  REAGENTS NOT WORKING

export interface EffectDescription {
  text: string | null;
  location?: { zone: string; x: number; y: number; z: number };
  item?: EntitySummary;
  spell?: EntitySummary;
}

const getBaseValue = (spell: SpellNew, effectIndex: number) =>
  (spell as any)[`effect_base_value${effectIndex}`];
const getLimitValue = (spell: SpellNew, effectIndex: number) =>
  (spell as any)[`effect_limit_value${effectIndex}`];
const getMaxValue = (spell: SpellNew, effectIndex: number) =>
  (spell as any)[`max${effectIndex}`];

export const getEffectSpell = (spell: SpellNew, effectIndex: number) =>
  spell.effectSpells?.find((effectSpell) => effectSpell.index === effectIndex);
export const getEffectItem = (spell: SpellNew, effectIndex: number) =>
  spell.effectItems?.find((effectSpell) => effectSpell.index === effectIndex);

interface SpellEffect {
  id: number;
  spa: string;
  effectName: string | null;
  description: string;
  base: string | number;
  limit: string;
  max: string;
  notes: string;
  buildEffectDescription?: (
    spell: SpellNew,
    effectIndex: number,
    itemEffectLevel?: number,
  ) => EffectDescription | null;
}

function getMinClassLevel(spell: SpellNew) {
  const minClassLevel = Math.min(
    ...[
      spell.classes1,
      spell.classes2,
      spell.classes3,
      spell.classes4,
      spell.classes5,
      spell.classes6,
      spell.classes7,
      spell.classes8,
      spell.classes9,
      spell.classes10,
      spell.classes11,
      spell.classes12,
      spell.classes13,
      spell.classes14,
      spell.classes15,
    ],
  );
  return minClassLevel === 255 ? 0 : minClassLevel;
}

export function getSpellDurations(spell: SpellNew) {
  const minLevel = getMinClassLevel(spell) || 1;
  let maxLevel = 65;

  const minDuration = duration(
    spell.buffdurationformula,
    spell.buffduration,
    minLevel,
  );

  // Find the lowest level that still has the same maximum duration
  let maxDuration = -Infinity;
  for (; maxLevel >= minLevel; maxLevel--) {
    const dur = duration(
      spell.buffdurationformula,
      spell.buffduration,
      maxLevel,
    );
    if (dur < maxDuration) {
      maxLevel++; // the last level was the lowest level before the duration decreased
      break;
    }
    maxDuration = dur;
  }

  return { minDuration, maxDuration, minLevel, maxLevel };
}

function getEffectValues(
  spell: SpellNew,
  effectIndex: number,
  spellLevel: number = 0,
  specificEffectLevel?: number,
) {
  const spellAsAny = spell as any;
  const formula: number = spellAsAny[`formula${effectIndex}`];
  const effectBase: number = spellAsAny[`effect_base_value${effectIndex}`];
  const isBaseNegative = effectBase < 0;
  let max = spellAsAny[`max${effectIndex}`];
  // Figure out the calculated max value
  const MAX_LEVEL = 65;
  const calculatedMax = Math.round(
    getEffectValue(
      formula,
      Math.abs(effectBase),
      specificEffectLevel || MAX_LEVEL,
      Infinity,
      spellLevel,
      specificEffectLevel,
    ).value,
  );
  // Set max based on calculated + specified max value
  if (max !== 0) {
    max = Math.min(calculatedMax, max);
  } else {
    max = calculatedMax;
  }
  // Make max match the base's sign
  max = isBaseNegative && max > 0 ? max * -1 : max;

  // Figure out the min value
  const minClassLevel = getMinClassLevel(spell);
  const minLevel = specificEffectLevel || minClassLevel;
  const effectValue = getEffectValue(
    formula,
    Math.abs(effectBase),
    minLevel,
    Math.abs(max),
    spellLevel,
    specificEffectLevel,
  );
  let min = Math.round(effectValue.value * (isBaseNegative ? -1 : 1)); // TODO:  Should this be Math.floor? Ceil? idk.
  if (max !== 0 && Math.abs(min) > Math.abs(max)) {
    min = max;
  }
  const maxLevel = effectValue.maxLevel;

  return { min, max, minLevel, maxLevel };
}

// real lazy attempt to not have to define a buncha effect texts
// if there's not a buildEffectText function on an effect, it uses this.
export function buildEffectGeneric(
  spell: SpellNew,
  effectIndex: number,
  itemEffectLevel?: number,
) {
  const effectId = (spell as any)[`effectid${effectIndex}`];
  const effect = spellEffectMap.get(effectId);
  if (!effect || !effect.effectName) {
    return null;
  }

  const maxValue = getMaxValue(spell, effectIndex);
  const baseValue = getBaseValue(spell, effectIndex);
  const limitValue = getLimitValue(spell, effectIndex);
  const effectBaseString = effect.base.toString();

  let maxTargetLevel = '';
  if (effect.max === 'max target level' && maxValue > 0) {
    maxTargetLevel = ` (up to level ${maxValue})`;
  }

  const basePercentTexts = [
    'percentage',
    'percent',
    'percent chance',
    'percent modifier',
    'min percent',
    'percent healing',
    'percent shrink or grow',
  ];
  const maxPercentTexts = ['max percent'];
  const baseDurationTexts = ['milliseconds', 'duration ms'];
  const baseAmountTexts = ['amount'];

  let text = effect.effectName;
  if (basePercentTexts.includes(effectBaseString)) {
    const fromAmount = [
      'min percent',
      'percent modifier',
      'percent shrink or grow',
    ].includes(effectBaseString);
    text =
      buildEffectTextPercent(
        effect.effectName,
        spell,
        effectIndex,
        itemEffectLevel,
        false,
        fromAmount,
      ) || effect.effectName;
  } else if (baseDurationTexts.includes(effectBaseString)) {
    text = `${effect.effectName} (${formatTime(baseValue) || baseValue / 1000 + 's'})`;
  } else if (baseAmountTexts.includes(effectBaseString)) {
    text =
      buildEffectText(effect.effectName, spell, effectIndex, itemEffectLevel) ||
      effect.effectName;
  }

  return `${text}${maxTargetLevel}`;

  // base: 'percentage exp',
  // base: 'coordinate(x,y,z,h)',
  // base: 'percent shrink or grow',
  // base: 'percent chance',
  // base: 'resist type',
  // base: 'percentage',
  // base: 'milliseconds',
  // base: 'min percent',
  // max: 'max percent',
  // limit: 'rate modifer',
  // base: 'max target level',
  // base: 'amount',
  // base: 'heal amount multiplier',
  // max: 'max heal amount multipler',
  // base: 'percent',
  // base: 'percent healing',
  // base: 'percent chance',
  // base: 'percent modifer',
}

function buildEffectTextPercent(
  effectValueType: string,
  spell: SpellNew,
  effectIndex: number,
  itemEffectLevel?: number,
  perTick: boolean = false,
  fromAmount: boolean = false,
) {
  const { min, max, minLevel, maxLevel } = getEffectValues(
    spell,
    effectIndex,
    0,
    itemEffectLevel,
  );

  const { maxDuration } = getSpellDurations(spell);

  if (min === 0 && max === 0) {
    return null;
  }

  const percentAdjustment = fromAmount ? 0 : 100;
  const minAdjusted = (min - percentAdjustment) / 100;
  const maxAdjusted = (max - percentAdjustment) / 100;
  const minAbsPercent = formatPercent(Math.abs(minAdjusted), 'en-US', '1.0-0');
  const maxAbsPercent = formatPercent(Math.abs(maxAdjusted), 'en-US', '1.0-0');

  const hasMax = max !== 0;
  const maxText =
    hasMax && min !== max
      ? ` (L${minLevel}) to ${maxAbsPercent} (L${maxLevel})`
      : '';

  const verb = minAdjusted < 0 ? 'Decrease' : 'Increase';
  const perTickText = perTick && maxDuration > 0 ? ' per tick' : '';
  return `${verb} ${effectValueType} by ${minAbsPercent}${maxText}${perTickText}`;
}

function buildEffectText(
  effectValueType: string,
  spell: SpellNew,
  effectIndex: number,
  itemEffectLevel?: number,
  perTick: boolean = false,
  flipVerb: boolean = false,
) {
  const { min, max, minLevel, maxLevel } = getEffectValues(
    spell,
    effectIndex,
    0,
    itemEffectLevel,
  );

  const { maxDuration } = getSpellDurations(spell);

  if (min === 0 && max === 0) {
    return null;
  }

  const hasMax = max !== 0;
  const maxText =
    hasMax && min !== max
      ? ` (L${minLevel}) to ${Math.abs(max)} (L${maxLevel})`
      : '';

  const verb = min < 0 && !flipVerb ? 'Decrease' : 'Increase';
  const perTickText = perTick && maxDuration > 0 ? ' per tick' : '';
  return `${verb} ${effectValueType} by ${Math.abs(
    min,
  )}${maxText}${perTickText}`;
}

function getEffectValue(
  formula: number,
  effectBase: number,
  effectLevel: number,
  effectMax: number,
  spellLevel: number = 0, // Player level? nah don't think so. idk what this is.
  specificLevel?: number,
) {
  if (formula === 100) {
    return {
      value: effectBase,
      maxLevel: undefined,
    };
  }
  if (formula === 101) {
    return {
      value: effectBase + effectLevel / 2,
      maxLevel: specificLevel || (effectMax - effectBase) * 2,
    };
  }
  if (formula === 102) {
    return {
      value: effectBase + effectLevel,
      maxLevel: specificLevel || effectMax - effectBase,
    };
  }
  if (formula === 103) {
    return {
      value: effectBase + effectLevel * 2,
      maxLevel: specificLevel || (effectMax - effectBase) / 2,
    };
  }
  if (formula === 104) {
    return {
      value: effectBase + effectLevel * 3,
      maxLevel: specificLevel || (effectMax - effectBase) / 2,
    };
  }
  if (formula === 105) {
    return {
      value: effectBase + effectLevel * 4,
      maxLevel: specificLevel || (effectMax - effectBase) / 2,
    };
  }
  if (formula === 106) {
    return {
      value: effectBase + effectLevel / 2,
      maxLevel: specificLevel || (effectMax - effectBase) * 2,
    };
  }
  if (formula === 107) {
    return {
      value: effectBase + effectLevel / 2,
      maxLevel: specificLevel || (effectMax - effectBase) * 2,
    };
  }
  if (formula === 108) {
    return {
      value: effectBase + effectLevel / 3,
      maxLevel: specificLevel || (effectMax - effectBase) * 3,
    };
  }
  if (formula === 109) {
    return {
      value: effectBase + effectLevel / 4,
      maxLevel: specificLevel || (effectMax - effectBase) * 4,
    };
  }
  if (formula === 110) {
    return {
      value: effectBase + effectLevel / 5,
      maxLevel: specificLevel || (effectMax - effectBase) * 5,
    };
  }
  if (formula === 111) {
    return {
      value: effectBase + 6 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 6 + spellLevel,
    };
  }
  if (formula === 112) {
    return {
      value: effectBase + 8 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 8 + spellLevel,
    };
  }
  if (formula === 113) {
    return {
      value: effectBase + 10 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 10 + spellLevel,
    };
  }
  if (formula === 114) {
    return {
      value: effectBase + 15 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 15 + spellLevel,
    };
  }
  if (formula === 115) {
    return {
      value: effectBase + 6 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 6 + spellLevel,
    };
  }
  if (formula === 116) {
    return {
      value: effectBase + 8 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 8 + spellLevel,
    };
  }
  if (formula === 117) {
    return {
      value: effectBase + 12 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 12 + spellLevel,
    };
  }
  if (formula === 118) {
    return {
      value: effectBase + 20 * (effectLevel - spellLevel),
      maxLevel: specificLevel || effectMax - effectBase / 20 + spellLevel,
    };
  }
  if (formula === 119) {
    return {
      value: effectBase + effectLevel / 8,
      maxLevel: specificLevel || (effectMax - effectBase) * 8,
    };
  }
  if (formula === 121) {
    return {
      value: effectBase + effectLevel / 3,
      maxLevel: specificLevel || (effectMax - effectBase) * 3,
    };
  }
  if (formula === 122) {
    console.log('wtf is splurt on effect formulas');
    return { value: effectBase, maxLevel: undefined };
  }
  if (formula === 123) {
    return {
      value: effectBase + Math.random() * (effectMax - effectBase),
      maxLevel: specificLevel || undefined,
    };
  }
  if (formula === 203) {
    return { value: effectMax, maxLevel: specificLevel || undefined };
  }

  return { value: effectBase, maxLevel: specificLevel || undefined };
}

function duration(formula: number, duration: number, level: number) {
  if (formula === 0) {
    return 0;
  }
  if (formula === 1) {
    return Math.round(Math.min(level / 2, duration));
  }
  if (formula === 2) {
    return Math.round((duration / 5) * 3);
  }
  if (formula === 3) {
    return Math.round(Math.min(level * 30, duration));
  }
  if (formula === 4) {
    return duration !== 0 ? duration : 50;
  }
  if (formula === 5) {
    return Math.min(duration, 3);
  }
  if (formula === 6) {
    return Math.round(Math.min(level / 2, duration));
  }
  if (formula === 7) {
    return duration !== 0 ? duration : level;
  }
  if (formula === 8) {
    return Math.round(Math.min(level + 10, duration));
  }
  if (formula === 9) {
    return Math.round(Math.min(level * 2 + 10, duration));
  }
  if (formula === 10) {
    return Math.round(Math.min(level * 3 + 10, duration));
  }
  if (formula === 11) {
    return duration;
  }
  if (formula === 12) {
    return duration;
  }
  if (formula === 13) {
    return duration; // unknown, default to duration
  }
  if (formula === 14) {
    return duration; // unknown, default to duration
  }
  if (formula === 15) {
    return duration; // unknown, default to duration
  }
  if (formula === 50) {
    return (5 * 24 * 60 * 60) / 6; // 5 days converted to ticks
  }
  if (formula === 51) {
    return Infinity;
  }
  if (formula === 3600) {
    return duration !== 0 ? duration : 3600;
  }

  return duration;
}

const spellEffects: SpellEffect[] = [
  {
    id: 0,
    spa: 'SE_CurrentHP',
    effectName: 'Current HP',
    description:
      'Modify targets hit points by amount, repeates every tic if in a buff. Heals and damage.',
    base: 'amount',
    limit: 'target restriction id',
    max: 'max amount (use positive value)',
    notes: 'Negative base value for damage',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'hitpoints',
        spell,
        effectIndex,
        itemEffectLevel,
        true,
      ),
    }),
  },
  {
    id: 1,
    spa: 'SE_ArmorClass',
    effectName: 'AC',
    description: 'Modify AC by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('AC', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 2,
    spa: 'SE_ATK',
    effectName: 'ATK',
    description: 'Modify ATK by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('ATK', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 3,
    spa: 'SE_MovementSpeed',
    effectName: 'Movement Rate',
    description: 'Modify movement speed by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectTextPercent(
        'movement speed',
        spell,
        effectIndex,
        itemEffectLevel,
        false,
        true,
      ),
    }),
  },
  {
    id: 4,
    spa: 'SE_STR',
    effectName: 'STR',
    description: 'Modify STR by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('STR', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 5,
    spa: 'SE_DEX',
    effectName: 'DEX',
    description: 'Modify DEX by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('DEX', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 6,
    spa: 'SE_AGI',
    effectName: 'AGI',
    description: 'Modify AGI by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('AGI', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 7,
    spa: 'SE_STA',
    effectName: 'STA',
    description: 'Modify STA by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('STA', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 8,
    spa: 'SE_INT',
    effectName: 'INT',
    description: 'Modify INT by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('INT', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 9,
    spa: 'SE_WIS',
    effectName: 'WIS',
    description: 'Modify WIS by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('WIS', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 10,
    spa: 'SE_CHA',
    effectName: 'CHA',
    description: 'Modify CHA by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('CHA', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 11,
    spa: 'SE_AttackSpeed',
    effectName: 'Attack Speed',
    description: 'Modify attack speed by percent',
    base: 'percent haste or slow',
    limit: 'none',
    max: 'none',
    notes: 'Base greater than 100 for haste (120 = 20 pct haste)',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectTextPercent(
        'attack speed',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 12,
    spa: 'SE_Invisibility',
    effectName: 'Invisibility: Unstable',
    description: 'Apply invsibility that can drop before duration ends',
    base: 'invisibility level',
    limit: 'none',
    max: 'none',
    notes:
      'Invisibility level determines what level of see invisible can detect it.',
  },
  {
    id: 13,
    spa: 'SE_SeeInvis',
    effectName: 'See Invisible',
    description:
      'Apply see invisbile which will allow you to see invisible entities',
    base: 'see invisible level',
    limit: 'none',
    max: 'none',
    notes: 'See Invisible level determines what level of invisible it can see.',
  },
  {
    id: 14,
    spa: 'SE_WaterBreathing',
    effectName: 'Water Breathing',
    description: 'Immune to drowning',
    base: '1 (increase for stacking overwrite)',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 15,
    spa: 'SE_CurrentMana',
    effectName: 'Mana',
    description: 'Modify mana by amount, repeates every tic if in a buff.',
    base: 'amount',
    limit: 'none',
    max: 'max amount (use positive value)',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('mana', spell, effectIndex, itemEffectLevel, true),
    }),
  },
  {
    id: 16,
    spa: 'SE_NPCFrenzy',
    effectName: 'NPC Frenzy',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 17,
    spa: 'SE_NPCAwareness',
    effectName: 'NPC Awareness',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 18,
    spa: 'SE_Lull',
    effectName: 'Pacify',
    description: 'Seen in harmony and lull spells. No coded functionality.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 19,
    spa: 'SE_AddFaction',
    effectName: 'NPC Faction',
    description: 'Modify your faction with an NPC by amount',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('faction', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 20,
    spa: 'SE_Blind',
    effectName: 'Blindness',
    description:
      "Remove vision from clients or cause NPC's to flee if not in melee range.",
    base: '1 (increase for stacking overwrite)',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 21,
    spa: 'SE_Stun',
    effectName: 'Stun',
    description:
      'Interrupts spell casting and prevents target from doing any actions for duration',
    base: 'duration ms',
    limit: 'pvp duration ms',
    max: 'max target level',
    notes: '',
    // buildEffectDescription: (
    //   spell: SpellNew,
    //   effectIndex: number,
    //   itemEffectLevel?: number,
    // ) => {
    //   const baseDuration = formatTime(getBaseValue(spell, effectIndex))
    //     .replace('(', '')
    //     .replace(')', '');
    //   const pvpDuration = formatTime(getLimitValue(spell, effectIndex))
    //     .replace('(', '')
    //     .replace(')', '');
    //   const maxTargetLevel = getMaxValue(spell, effectIndex)
    //     ? ` (up to level ${getMaxValue(spell, effectIndex)})`
    //     : '';
    //   return {
    //     text: `Stun (${baseDuration})${maxTargetLevel}`,
    //   };
    // },
  },
  {
    id: 22,
    spa: 'SE_Charm',
    effectName: 'Charm',
    description: 'Control another entity as your pet',
    base: 'Unknown set to 1',
    limit: 'none',
    max: 'max target level',
    notes: '',
    // buildEffectDescription: (
    //   spell: SpellNew,
    //   effectIndex: number,
    //   itemEffectLevel?: number,
    // ) => {
    //   const maxTargetLevel = getMaxValue(spell, effectIndex)
    //     ? ` (up to level ${getMaxValue(spell, effectIndex)})`
    //     : '';
    //   return {
    //     text: `Charm${maxTargetLevel}`,
    //   };
    // },
  },
  {
    id: 23,
    spa: 'SE_Fear',
    effectName: 'Fear',
    description: 'Causes the entity to run away until duration ends',
    base: 'Unknown set to 1',
    limit: 'none',
    max: 'max target level',
    notes: '',
  },
  {
    id: 24,
    spa: 'SE_Stamina',
    effectName: 'Stamina Loss',
    description:
      'Modify endurance upkeep by amount while using disciplines that drain endurance',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Positive value will reduce endurance upkeep',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'endurance',
        spell,
        effectIndex,
        itemEffectLevel,
        true,
      ),
    }),
  },
  {
    id: 25,
    spa: 'SE_BindAffinity',
    effectName: 'Bind Affinity',
    description: 'Bind location for gate spell.',
    base: 'bind id (Set to 1, 2, or 3)',
    limit: 'none',
    max: 'none',
    notes:
      'Bind id allows you set alternate bind points. Bind Point ID (1=Primary, 2=Secondary 3=Tertiary)',
  },
  {
    id: 26,
    spa: 'SE_Gate',
    effectName: 'Gate',
    description: 'Chance to teleport to bind location.',
    base: 'success chance',
    limit: 'bind id (2 or 3)',
    max: 'none',
    notes:
      'If limit is not set, you will gate to primary bind location. Bind Point ID (1=Primary, 2=Secondary 3=Tertiary)',
  },
  {
    id: 27,
    spa: 'SE_CancelMagic',
    effectName: 'Dispel Magic',
    description: 'Chance to removes detrimental and beneficial buffs',
    base: 'chance level modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Success chance is based on level difference of caster and caster of the buff, base value raises the casters level by the base amount.',
  },
  {
    id: 28,
    spa: 'SE_InvisVsUndead',
    effectName: 'Invisibility to Undead: Unstable',
    description:
      'Apply invsibility verse undead that can drop before duration ends',
    base: 'invisibility level',
    limit: 'none',
    max: 'none',
    notes:
      'Invisibility level determines what level of see invisible can detect it.',
  },
  {
    id: 29,
    spa: 'SE_InvisVsAnimals',
    effectName: 'Invisibility to Animals: Unstable',
    description:
      'Apply invsibility verse animals that can drop before duration ends',
    base: 'invisibility level',
    limit: 'none',
    max: 'none',
    notes:
      'Invisibility level determines what level of see invisible can detect it.',
  },
  {
    id: 30,
    spa: 'SE_ChangeFrenzyRad',
    effectName: 'NPC Aggro Radius',
    description: 'Set NPC aggro radius',
    base: 'amount',
    limit: 'none',
    max: 'max target level',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'aggro radius',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 31,
    spa: 'SE_Mez',
    effectName: 'Mesmerize',
    description: 'Stuns target until duration ends or target takes damage.',
    base: '1 (increase for stacking overwrite)',
    limit: 'none',
    max: 'max target level',
    notes:
      'Higher value of stacking type will always override the lower value. Used if you want one type of mez to overrite another.',
  },
  {
    id: 32,
    spa: 'SE_SummonItem',
    effectName: 'Summon Item',
    description: 'Summon an item.',
    base: 'item id',
    limit: 'none',
    max: 'stack amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      const summonedItem = spell.effectItems?.find(
        (effectItem) => effectItem.index === effectIndex,
      );
      return {
        text: 'Summon Item: ',
        item: {
          id: summonedItem?.id,
          name: summonedItem?.name,
        },
      };
    },
  },
  {
    id: 33,
    spa: 'SE_SummonPet',
    effectName: 'Summon Pet',
    description: 'Summon a pet.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to be the same as 'type' field in of the pet you want in the pets table.",
    // TODO:  summon pet
  },
  {
    id: 34,
    spa: 'SE_Confuse',
    effectName: 'Confuse',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 35,
    spa: 'SE_DiseaseCounter',
    effectName: 'Disease Counter',
    description:
      'Determines potency of determental disease spells or potency of cures.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Set to positive values for potency of detrimental spells',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'disease counter',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 36,
    spa: 'SE_PoisonCounter',
    effectName: 'Poison Counter',
    description:
      'Determines potency of determental poison spells or potency of cures.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Set to positive values for potency of detrimental spells',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'poison counter',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 37,
    spa: 'SE_DetectHostile',
    effectName: 'Detect Hostile',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 38,
    spa: 'SE_DetectMagic',
    effectName: 'Detect Magic',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 39,
    spa: 'SE_TwinCastBlocker',
    effectName: 'Twincast Blocker',
    description: 'Prevent this spell from being twincast.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 40,
    spa: 'SE_DivineAura',
    effectName: 'Invulnerability',
    description:
      'Invulnerable to spells and melee, you can not cast or melee while under this effect.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 41,
    spa: 'SE_Destroy',
    effectName: 'Destroy',
    description: 'Instantly kill target.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 42,
    spa: 'SE_ShadowStep',
    effectName: 'Shadow Step',
    description: 'Warps player a short distance in a random direction.',
    base: 'Unknown (Seen 1 to 50)',
    limit: 'none',
    max: 'none',
    notes:
      'This effect is handled by the client. Changing the base value does not appear to have any affect.',
  },
  {
    id: 43,
    spa: 'SE_Berserk',
    effectName: 'Berserk',
    description:
      "Sets entity as 'Berserk' allowing for chance to crippling blow regardless of hit points and class.",
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      'This is an unused live spell effect. Custom Spell Effect may be subject to change if live reuses the SPA.',
  },
  {
    id: 44,
    spa: 'SE_Lycanthropy',
    effectName: 'Stacking: Delayed Heal Marker',
    description:
      'Used as stacking checker in healing effects that use spell triggers.',
    base: 'stacking overwrite value',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 45,
    spa: 'SE_Vampirism',
    effectName: 'Vampirism',
    description: 'Heal for a percentage for your melee damage on target.',
    base: 'Percentage',
    limit: 'none',
    max: 'none',
    notes:
      'This is an unused live spell effect. Custom Spell Effect may be subject to change if live reuses the SPA.',
  },
  {
    id: 46,
    spa: 'SE_ResistFire',
    effectName: 'Fire Resist',
    description: 'Modify fire resist by amount',
    base: 'amout',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('fire resist', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 47,
    spa: 'SE_ResistCold',
    effectName: 'Cold Resist',
    description: 'Modify cold resist by amount',
    base: 'amout',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('cold resist', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 48,
    spa: 'SE_ResistPoison',
    effectName: 'Poison Resist',
    description: 'Modify poison resist by amount',
    base: 'amout',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'poison resist',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 49,
    spa: 'SE_ResistDisease',
    effectName: 'Disease Resist',
    description: 'Modify disease resist by amount',
    base: 'amout',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'disease resist',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 50,
    spa: 'SE_ResistMagic',
    effectName: 'Magic Resist',
    description: 'Modify magic resist by amount',
    base: 'amout',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'magic resist',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 51,
    spa: 'SE_DetectTraps',
    effectName: 'Detect Traps',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 52,
    spa: 'SE_SenseDead',
    effectName: 'Detect Undead',
    description: 'Point player in direction of nearest Undead NPC',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 53,
    spa: 'SE_SenseSummoned',
    effectName: 'Detect Summoned',
    description: 'Point player in direction of nearest Summoned NPC',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 54,
    spa: 'SE_SenseAnimals',
    effectName: 'Detect Animals',
    description: 'Point player in direction of nearest Animal NPC',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 55,
    spa: 'SE_Rune',
    effectName: 'Rune',
    description:
      'Absorb all melee damage until a maxium amount of damage is taken then fades.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'absorb melee damage',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 56,
    spa: 'SE_TrueNorth',
    effectName: 'True North',
    description: 'Points player in north direction.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 57,
    spa: 'SE_Levitate',
    effectName: 'Levitation',
    description: 'Float above ground and take no fall damage.',
    base: '1 (increase for stacking overwrite)',
    limit: 'levitate while moving (Set to 1)',
    max: 'none',
    notes: "Levitate while moving is seen on Live 'Flying Mounts'",
  },
  {
    id: 58,
    spa: 'SE_Illusion',
    effectName: 'Illusion',
    description: 'Change appearance.',
    base: 'race id or gender id',
    limit: 'texture id (see notes)',
    max: 'helmet id (see notes)',
    notes:
      'Illusions have complicated rules. See https://docs.eqemu.io/server/categories/spells/illusion-spell-guidelines',
  },
  {
    id: 59,
    spa: 'SE_DamageShield',
    effectName: 'Damage Shield',
    description:
      'Take damage for the damage shield amount when meleeing a target with his effect.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'damage shield',
        spell,
        effectIndex,
        itemEffectLevel,
        false,
        true,
      ),
    }),
  },
  {
    id: 60,
    spa: 'SE_TransferItem',
    effectName: 'Transfer Item',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 61,
    spa: 'SE_Identify',
    effectName: 'Identify',
    description:
      'Provides information about the item that your target is holding.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "To use, hold item on cursor and cast spell on self or target. The 'lore' field from items table is displayed in chat window.",
  },
  {
    id: 62,
    spa: 'SE_ItemID',
    effectName: 'Item ID',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 63,
    spa: 'SE_WipeHateList',
    effectName: 'Memblur',
    description:
      'Chance to wipe hate list of target, repeates every tic if in a buff.',
    base: 'percent chance',
    limit: 'none',
    max: 'unknown',
    notes:
      'Actual chance to memory blur is much higher than the spells base value, caster level and CHA modifiers are added get the final calculated percent chance',
  },
  {
    id: 64,
    spa: 'SE_SpinTarget',
    effectName: 'Spin Stun',
    description: 'Spins and stuns target',
    base: 'duration ms',
    limit: 'pvp duration ms',
    max: 'max target level',
    notes: '',
  },
  {
    id: 65,
    spa: 'SE_InfraVision',
    effectName: 'Infravision',
    description: 'Improved night vision',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 66,
    spa: 'SE_UltraVision',
    effectName: 'Ultravision',
    description: 'Vastly improved night vision',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 67,
    spa: 'SE_EyeOfZomm',
    effectName: 'Eye Of Zomm',
    description:
      'Transfers your vision and control to a summoned temporary pet',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to be the same as 'type' field in of the pet you want in the pets table.",
  },
  {
    id: 68,
    spa: 'SE_ReclaimPet',
    effectName: 'Reclaim Energy',
    description:
      'Kills your pet in exchange for mana. Returns 75 percent of pet spell actual mana cost.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 69,
    spa: 'SE_TotalHP',
    effectName: 'Max HP',
    description: 'Modify maximum hit points by amount.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('Max HP', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 70,
    spa: 'SE_CorpseBomb',
    effectName: 'Corpse Bomb',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 71,
    spa: 'SE_NecPet',
    effectName: 'Create Undead Pet',
    description: 'Summon a pet.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to be the same as 'type' field in of the pet you want in the pets table.",
  },
  {
    id: 72,
    spa: 'SE_PreserveCorpse',
    effectName: 'Preserve Corpse',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 73,
    spa: 'SE_BindSight',
    effectName: 'Bind Sight',
    description: 'Transfers your vision to your target.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 74,
    spa: 'SE_FeignDeath',
    effectName: 'Feign Death',
    description:
      'Fall to the ground and have a chance to loss aggro from engaged NPCs.',
    base: 'success chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 75,
    spa: 'SE_VoiceGraft',
    effectName: 'Voice Graft',
    description: 'Speak through your pet',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 76,
    spa: 'SE_Sentinel',
    effectName: 'Sentinel',
    description:
      "Creates a proximity zone where cast that alerts caster if NPC's or Players enter it.",
    base: 1,
    limit: 'none',
    max: 'none',
    notes: 'Not implemented on EQEMU',
  },
  {
    id: 77,
    spa: 'SE_LocateCorpse',
    effectName: 'Locate Corpse',
    description: "Points player in direction of their target's corpse.",
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 78,
    spa: 'SE_AbsorbMagicAtt',
    effectName: 'Spell Rune',
    description:
      'Absorb all spell damage until a maxium amount of damage is taken then fades.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'absorb magic damage',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 79,
    spa: 'SE_CurrentHPOnce',
    effectName: 'Current HP Once',
    description:
      'Modify hit points by amount. Instant heals and direct damage.',
    base: 'amount',
    limit: 'target restriction id',
    max: 'max amount',
    notes: 'Negative base value for damage',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('hitpoints', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 80,
    spa: 'SE_EnchantLight',
    effectName: 'Enchant Light',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 81,
    spa: 'SE_Revive',
    effectName: 'Resurrect',
    description:
      'Summon player to corpse and restore a percentage of experience.',
    base: 'percentage exp',
    limit: 'none',
    max: 'none',
    notes: '', // TODO rez with percent
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: `Resurrect (restore ${getBaseValue(spell, effectIndex)}% experience)`,
    }),
  },
  {
    id: 82,
    spa: 'SE_SummonPC',
    effectName: 'Summon Player',
    description: 'Summon a player to casters location.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 83,
    spa: 'SE_Teleport',
    effectName: 'Teleport',
    description: 'Teleport to another zone or location.',
    base: 'coordinate(x,y,z,h)',
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to zone short name OR set to 'same' to teleport within same zone. To set all xyzh cooridinates, you have use the following. Use this effectid only once in first effect slot . Cooridinates defined as effect_base_value1=x effect_base_value2=y effect_base_value3=z effect_base_value4=h",
  },
  {
    id: 84,
    spa: 'SE_TossUp',
    effectName: 'Gravity Flux',
    description: 'Toss up into the air.',
    base: 'distance (negative)',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 85,
    spa: 'SE_WeaponProc',
    effectName: 'Add Melee Proc',
    description: 'Add proc to melee',
    base: 'spellid',
    limit: 'rate modifer',
    max: 'none',
    notes: '',
  },
  {
    id: 86,
    spa: 'SE_Harmony',
    effectName: 'Reaction Radius',
    description: 'Set NPC assist radius',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 87,
    spa: 'SE_MagnifyVision',
    effectName: 'Magnification',
    description: 'Zoom players vision',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 88,
    spa: 'SE_Succor',
    effectName: 'Evacuate',
    description:
      'Teleport Group/Self to a defined location or to safe point in zone with a 2 percent fail rate',
    base: 'coordinate(x,y,z,h)',
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to zone short name OR set to 'same' to evac within same zone. To set all xyzh cooridinates, you have use the following. Use this effectid only once in first effect slot . Cooridinates defined as effect_base_value1=x effect_base_value2=y effect_base_value3=z effect_base_value4=h",
  },
  {
    id: 89,
    spa: 'SE_ModelSize',
    effectName: 'Player Size',
    description:
      'Modify targets size by percent or set to a specific model size.',
    base: 'percent shrink or grow',
    limit: 'model size',
    max: 'unknown',
    notes: 'Base greater than 100 for growth (120 = 20 pct growth)',
  },
  {
    id: 90,
    spa: 'SE_Cloak',
    effectName: 'Ignore Pet',
    description: 'Ignore pet',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: 'Not implemented on EQEMU',
  },
  {
    id: 91,
    spa: 'SE_SummonCorpse',
    effectName: 'Summon Corpse',
    description: 'Summon targets corpse to caster.',
    base: 'max target level',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 92,
    spa: 'SE_InstantHate',
    effectName: 'Hate',
    description: 'Add or remove a set amount of hate instantly from target.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: 'Positive value increases hate.',
  },
  {
    id: 93,
    spa: 'SE_StopRain',
    effectName: 'Control Weather',
    description: 'Stops zone weather related rain.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 94,
    spa: 'SE_NegateIfCombat',
    effectName: 'Make Fragile',
    description: 'Removes buff if player casts or does any combat skill.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 95,
    spa: 'SE_Sacrifice',
    effectName: 'Sacrifice',
    description:
      "Kills player and creates 'Essence Emerald', corpse can not be resurrected",
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 96,
    spa: 'SE_Silence',
    effectName: 'Silence',
    description: 'Prevents spell casting.',
    base: '1 (increase for stacking overwrite)',
    limit: 'none',
    max: 'unknown',
    notes: '',
  },
  {
    id: 97,
    spa: 'SE_ManaPool',
    effectName: 'Max Mana',
    description: 'Modify max mana pool by amount.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText('max mana', spell, effectIndex, itemEffectLevel),
    }),
  },
  {
    id: 98,
    spa: 'SE_AttackSpeed2',
    effectName: 'Attack Speed: Does not exceed cap',
    description:
      'Modify attack speed by percent. Stacks with other Attack Speed effects. Does need exceed haste cap.',
    base: 'percent haste or slow',
    limit: 'none',
    max: 'none',
    notes: 'Base greater than 100 for haste (120 = 20 pct haste)',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectTextPercent(
        'attack speed (stacks)',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 99,
    spa: 'SE_Root',
    effectName: 'Root',
    description: 'Immobilize target.',
    base: -10000,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 100,
    spa: 'SE_HealOverTime',
    effectName: 'Heal Over Time',
    description: 'Heal over time. Stacks with other heal over time effects.',
    base: 'amount',
    limit: 'target restriction id',
    max: 'max amount',
    notes: '',
  },
  {
    id: 101,
    spa: 'SE_CompleteHeal',
    effectName: 'Complete Heal: With Recast Blocker Buff',
    description:
      'Heal for baseline of 7500 HP and apply a buff icon that blocks the same effect from taking hold until it fades.',
    base: 'heal amount multiplier',
    limit: 'none',
    max: 'max heal amount multipler',
    notes: '',
  },
  {
    id: 102,
    spa: 'SE_Fearless',
    effectName: 'Fear Immunity',
    description: 'Immune to fear effect.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 103,
    spa: 'SE_CallPet',
    effectName: 'Summon Pet',
    description: 'Summon Pet to owner.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 104,
    spa: 'SE_Translocate',
    effectName: 'Translocate',
    description: 'Teleport your target to a specific location or bind.',
    base: 'coordinate(x,y,z,h) or Bind Point ID',
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to zone short name OR set to 'same' to evac within same zone. To set all xyzh cooridinates, you have use the following. Use this effectid only once in first effect slot . If 'Teleport_Zone' field is not set, then will send to bind point id, set base value to Bind Point ID (1=Primary, 2=Secondary 3=Tertiary)",
  },
  {
    id: 105,
    spa: 'SE_AntiGate',
    effectName: 'Inhibit Gate',
    description: 'Prevent target from casting gate',
    base: 'Seen 1 to 3',
    limit: 'none',
    max: 'none',
    notes:
      'Unclear what base value determines. May be related to Bind Point IDs.',
  },
  {
    id: 106,
    spa: 'SE_SummonBSTPet',
    effectName: 'Summon Warder',
    description: 'Summon a beastlord pet.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to be the same as 'type' field in of the pet you want in the pets table.",
  },
  {
    id: 107,
    spa: 'SE_AlterNPCLevel',
    effectName: 'Alter NPC Level',
    description:
      'Change NPC level by amount. Level returns to original level when buff fades.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes:
      'This is a no longer used on live. Custom Spell Effect may be subject to change if live reuses the SPA.',
  },
  {
    id: 108,
    spa: 'SE_Familiar',
    effectName: 'Summon Familiar',
    description: 'Summon a familiar.',
    base: '0 or 1',
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to be the same as 'type' field in of the pet you want in the pets table.",
  },
  {
    id: 109,
    spa: 'SE_SummonItemIntoBag',
    effectName: 'Summon into Bag',
    description: 'Summons item into a summoned bag.',
    base: 'item id',
    limit: 'none',
    max: 'none',
    notes:
      'To use this the first effectid must be SPA 32 SE_SummonItem and this must be a bag such as Phantom Satchel ID 17310. Then use this effectid to summon items that will go into that bag.',
  },
  {
    id: 110,
    spa: 'SE_IncreaseArchery',
    effectName: 'Increase Archery',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 111,
    spa: 'SE_ResistAll',
    effectName: 'All Resists',
    description: 'Modify all resists by amount.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
  },
  {
    id: 112,
    spa: 'SE_CastingLevel',
    effectName: 'Casting Level',
    description:
      'Modify casting level by amount, this will determine fizzel rate.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 113,
    spa: 'SE_SummonHorse',
    effectName: 'Summon Mount',
    description: 'Summon a mount',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to be the same as 'filename' field in of the mount you want in the horses table.",
  },
  {
    id: 114,
    spa: 'SE_ChangeAggro',
    effectName: 'Hate Multiplier',
    description: 'Modify hate generated by percent',
    base: 'percent hate modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 115,
    spa: 'SE_Hunger',
    effectName: 'Food',
    description: 'Resets hunger counter preventing hunger and thirst checks.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: 'Set to positive values for potency of detrimental spells',
  },
  {
    id: 116,
    spa: 'SE_CurseCounter',
    effectName: 'Curse Counter',
    description:
      'Determines potency of determental curse spells or potency of cures.',
    base: 'amount',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 117,
    spa: 'SE_MagicWeapon',
    effectName: 'Make Weapons Magical',
    description: 'Allows non-magic weapons to be considered magical',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 118,
    spa: 'SE_Amplification',
    effectName: 'Singing Amplification',
    description: "Modifies bard 'singing modifier' by percent.",
    base: 'percent',
    limit: 'none',
    max: 'none',
    notes:
      'Recasting this effect will cause it to focus itself, increasing its potency.',
  },
  {
    id: 119,
    spa: 'SE_AttackSpeed3',
    effectName: 'Attack Speed: Overhaste',
    description:
      'Modify attack speed by percent. Stacks with other Attack Speed effects. Can exceed haste cap.',
    base: 'percent haste or slow',
    limit: 'none',
    max: 'none',
    notes: 'Base greater than 100 for haste (120 = 20 pct haste)',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectTextPercent(
        'attack speed (overhaste)',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 120,
    spa: 'SE_HealRate',
    effectName: 'Incoming Healing Effectiveness',
    description: 'Modify incoming heals by percentage.',
    base: 'percent healing',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 121,
    spa: 'SE_ReverseDS',
    effectName: 'Reverse Damage Shield',
    description:
      'Heal for the reverse damage shields amount when meleeing a target with his effect.',
    base: 'amount',
    limit: '',
    max: '',
    notes: 'Negative value will cause the reverse damage shield to heal.',
  },
  {
    id: 122,
    spa: 'SE_ReduceSkill',
    effectName: 'Reduce Skill',
    description: 'pending',
    base: 'pending',
    limit: 'pending',
    max: 'pending',
    notes: 'not implemented',
  },
  {
    id: 123,
    spa: 'SE_Screech',
    effectName: 'Stacking: Screech',
    description:
      'If a buff has a Screech base value of +1 that buff will block any other buff that contains Screech with a base value of -1',
    base: '1 or -1',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 124,
    spa: 'SE_ImprovedDamage',
    effectName: 'Focus: Spell Damage',
    description: 'Modify outgoing spell damage by percentage.',
    base: 'min percent',
    limit: 'none',
    max: 'max percent',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Damage',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 125,
    spa: 'SE_ImprovedHeal',
    effectName: 'Focus: Healing',
    description: 'Modify outgoing spell healing by percentage.',
    base: 'min percent',
    limit: 'none',
    max: 'max percent',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Healing',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 126,
    spa: 'SE_SpellResistReduction',
    effectName: 'Focus: Spell Resist Rate',
    description: 'Modify outgoing spell resistance rate by percentage.',
    base: 'min percent',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 127,
    spa: 'SE_IncreaseSpellHaste',
    effectName: 'Focus: Spell Cast Time',
    description: 'Modify outgoing spell casting time by percentage.',
    base: 'percent',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Haste',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 128,
    spa: 'SE_IncreaseSpellDuration',
    effectName: 'Focus: Spell Duration',
    description: 'Modify outgoing spell buff duration by percentage.',
    base: 'percent',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Duration',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 129,
    spa: 'SE_IncreaseRange',
    effectName: 'Focus: Spell Range',
    description: 'Modify outgoing spell casting range percentage.',
    base: 'percent',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectTextPercent(
        'Spell Range',
        spell,
        effectIndex,
        itemEffectLevel,
        false,
        true,
      ),
    }),
  },
  {
    id: 130,
    spa: 'SE_SpellHateMod',
    effectName: 'Focus: Spell and Bash Hate',
    description: 'Modify outgoing spell and bash hate by percentage.',
    base: 'min percent',
    limit: 'none',
    max: 'max percent',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell and Bash Hate',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 131,
    spa: 'SE_ReduceReagentCost',
    effectName: 'Focus: Chance of Using Reagent',
    description:
      'Modify outgoing spells chance to not consume reagent by percentage',
    base: 'min percent',
    limit: 'none',
    max: 'max percent',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Chance of Using Reagent',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 132,
    spa: 'SE_ReduceManaCost',
    effectName: 'Focus: Spell Mana Cost',
    description: 'Reduce outgoing spells mana cost by percentage',
    base: 'min percent',
    limit: 'none',
    max: 'max percent',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: `Reduce Spell Mana Cost by ${getBaseValue(spell, effectIndex)}%`,
      };
    },
  },
  {
    id: 133,
    spa: 'SE_FcStunTimeMod',
    effectName: 'Focus: Spell Stun Duration',
    description: 'Modify outgoing spell stun duration by percentage.',
    base: 'percent',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: `Increase Spell Stun Duration by ${getBaseValue(spell, effectIndex)}%`,
      };
    },
  },
  {
    id: 134,
    spa: 'SE_LimitMaxLevel',
    effectName: 'Limit: Max Level',
    description:
      "Max level of spell that can be focused, if 'limit' is set then decrease effectiviness by the limit values percent per level over max level.",
    base: 'max level',
    limit: 'effectiviness percent',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: `Limit: Max Spell Level (${getBaseValue(spell, effectIndex)})`,
      };
    },
  },
  {
    id: 135,
    spa: 'SE_LimitResist',
    effectName: 'Limit: Resist',
    description: 'Resist Type(s) that a spell focus can require or exclude.',
    base: 'resist type',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
  },
  {
    id: 136,
    spa: 'SE_LimitTarget',
    effectName: 'Limit: Target',
    description: 'Target Type(s) that a spell focus can require or exclude.',
    base: 'target type',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
  },
  {
    id: 137,
    spa: 'SE_LimitEffect',
    effectName: 'Limit: Effect',
    description: 'Spell effect(s) that a spell focus can require or exclude.',
    base: 'spell effect ID',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      const limitedEffectId = getBaseValue(spell, effectIndex);
      const inclusionText = limitedEffectId >= 0 ? 'Require' : 'Exclude';
      const effectName = spellEffects.find(
        (effect) => effect.id === Math.abs(limitedEffectId),
      )?.effectName;
      return {
        text: `Limit: ${inclusionText} Effect (${effectName})`,
      };
    },
  },
  {
    id: 138,
    spa: 'SE_LimitSpellType',
    effectName: 'Limit: SpellType',
    description: 'Only allow focus spells that are Beneficial or Detrimental.',
    base: '0=Detrimental, 1=Beneficial',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      const spellType =
        getBaseValue(spell, effectIndex) === 0 ? 'Detrimental' : 'Beneficial';
      return {
        text: `Limit: Spell Type (${spellType}) `,
      };
    },
  },
  {
    id: 139,
    spa: 'SE_LimitSpell',
    effectName: 'Limit: Spell',
    description:
      'Specific spell id(s) that a spell focus can require or exclude.',
    base: 'spell ID',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: `Limit: ${getBaseValue(spell, effectIndex) > 0 ? 'Include' : 'Exclude'} Spell`,
    }),
  },
  {
    id: 140,
    spa: 'SE_LimitMinDur',
    effectName: 'Limit: Min Duration',
    description: 'Mininum duration of spell that can be focused.',
    base: 'tics',
    limit: 'none',
    max: 'none',
    notes: 'Set duration in tics, 1 tick is 6 seconds of game time',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: `Limit: Min Duration (${formatTime(getBaseValue(spell, effectIndex) * 6 * 1_000, true, true)})`,
    }),
  },
  {
    id: 141,
    spa: 'SE_LimitInstant',
    effectName: 'Limit: Instant spells only',
    description: 'Include or exclude if an instant cast spell can be focused.',
    base: '0=Exclude if Instant, 1=Allow only if Instant',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      const inclusionText =
        getBaseValue(spell, effectIndex) === 0 ? 'Exclude' : 'Only';
      return {
        text: `Limit: ${inclusionText} Instant Spells`,
      };
    },
  },
  {
    id: 142,
    spa: 'SE_LimitMinLevel',
    effectName: 'Limit: Min Level',
    description: 'Mininum level of spell that can be focused.',
    base: 'level',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 143,
    spa: 'SE_LimitCastTimeMin',
    effectName: 'Limit: Min Cast Time',
    description: 'Mininum cast time of spell that can be focused.',
    base: 'milliseconds',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 144,
    spa: 'SE_LimitCastTimeMax',
    effectName: 'Limit: Max Cast Time',
    description: 'Max cast time of spell that can be focused',
    base: 'milliseconds',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      const castTimeMs = getBaseValue(spell, effectIndex);
      const castTimeSeconds = Math.round(castTimeMs / 10) / 10;
      return {
        text: `Limit: Max Cast Time (${castTimeSeconds})`,
      };
    },
  },
  {
    id: 145,
    spa: 'SE_Teleport2',
    effectName: 'Banish',
    description:
      'Teleports targets to a defined location or to safe point in zone',
    base: 'coordinate(x,y,z,h)',
    limit: 'none',
    max: 'none',
    notes:
      "Set 'Teleport Zone' field to zone short name OR set to 'same' to teleport within same zone. To set all xyzh cooridinates, you have use the following. Use this effectid only once in first effect slot . Cooridinates defined as effect_base_value1=x effect_base_value2=y effect_base_value3=z effect_base_value4=h",
  },
  {
    id: 146,
    spa: 'SE_ElectricityResist',
    effectName: 'Portal Locations',
    description: 'pending',
    base: 'pending',
    limit: 'pending',
    max: 'pending',
    notes: '',
  },
  {
    id: 147,
    spa: 'SE_PercentalHeal',
    effectName: 'Percent HP Heal',
    description:
      'Modify targets hit points for percent value of the targets max HP. Heal or damage.',
    base: 'percentage',
    limit: 'none',
    max: 'max amount of hit points',
    notes: 'Negative base value for damage',
  },
  {
    id: 148,
    spa: 'SE_StackingCommand_Block',
    effectName: 'Stacking: Block',
    description:
      'Effect is found on buff and is used to prevent another buff from taking hold if specific criteria is met.',
    base: 'spell effect id',
    limit: 'none',
    max: 'Block if less than this value.',
    notes: 'Formula - 201 = Slot to block',
  },
  {
    id: 149,
    spa: 'SE_StackingCommand_Overwrite',
    effectName: 'Stacking: Overwrite',
    description:
      'Effect is found on buff and is used to overwrite another buff if specific criteria is met.',
    base: 'spell effect id',
    limit: 'none',
    max: 'Overwrite if less than this value.',
    notes: 'Formula - 201 = Slot to block',
  },
  {
    id: 150,
    spa: 'SE_DeathSave',
    effectName: 'Death Save',
    description:
      'When this effect is applied to a target the owner of the buff is given a chance at receiving a heal when under 15 percent hit points.',
    base: '1 = 300 HP Healed, 2 = 8000 HP Healed',
    limit: 'min target level to apply override heal amount',
    max: 'override heal amount',
    notes:
      'If max value is set as heal amount this value will be used instead as the heal amount if the owner of the buff is the mininum level specified in limit field. Chance to receive a heal is determined by the owner of the buffs Charisma. [Chance = ((Charisma * 3) +1) / 10) ] . SPA 277 gives a second chance to be healed if you fail.',
  },
  {
    id: 151,
    spa: 'SE_SuspendPet',
    effectName: 'Suspend Pet',
    description: 'Places a pet in temporary storage.',
    base: 'save type',
    limit: 'none',
    max: 'none',
    notes:
      'Save Types, 0 = save pet with no buffs or equipment, 1 = save pet with no buffs or equipment, 2 = unknown. SPA 308 allows for suspended pets to be resummoned after zoning.',
  },
  {
    id: 152,
    spa: 'SE_TemporaryPets',
    effectName: 'Summon a Pet Swarm',
    description:
      'Summon temporary pet(s) that will fade after duration, will stack with regular pets.',
    base: 'amount of pets',
    limit: 'none',
    max: 'duration seconds',
    notes:
      "Set 'Teleport Zone' field to be the same as 'type' field in of the pet you want in the pets table.",
  },
  {
    id: 153,
    spa: 'SE_BalanceHP',
    effectName: 'Balance Party HP',
    description:
      'Balances groups HP with a percent modifier to the damage being distributed.',
    base: 'percent modifier',
    limit: 'max HP taken from player',
    max: 'none',
    notes: 'Positive base value increases damage being distrubuted',
  },
  {
    id: 154,
    spa: 'SE_DispelDetrimental',
    effectName: 'Dispel Detrimental',
    description: 'Dispels detrimental buffs.',
    base: 'percent chance x 10',
    limit: 'none',
    max: 'none',
    notes: 'Actual percent chance is calculated as base / 10',
  },
  {
    id: 155,
    spa: 'SE_SpellCritDmgIncrease',
    effectName: 'Spell Critical Damage',
    description: 'Modifies critical spell damage by percent',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 156,
    spa: 'SE_IllusionCopy',
    effectName: 'Illusion: Target',
    description: 'Turns caster into mirror image of target.',
    base: 'Seen 0,1,30',
    limit: 'none',
    max: 'none',
    notes: 'Unknown what base values represent.',
  },
  {
    id: 157,
    spa: 'SE_SpellDamageShield',
    effectName: 'Spell Damage Shield',
    description: 'Inflicts non-melee damage on caster of a spell.',
    base: 'amount damage shield (negative)',
    limit: 'none',
    max: 'unknown',
    notes:
      "Spells must have 'feedbackable' field set to a value otherwise they will not be affected by spell damage shields.",
  },
  {
    id: 158,
    spa: 'SE_Reflect',
    effectName: 'Reflect Spell',
    description: 'Reflect casted detrimental spell back at caster.',
    base: 'percent chance',
    limit: 'resist modifier',
    max: 'percent of base damage modifier',
    notes:
      "Spells must have 'reflectable' field set to a value otherwise they will not be reflected. Resist modifer, positive value reduces the resist rate, negative value increases the resist rate. Percent of base damage modifer, max greater than 100 for damage mod (120 = 20 pct increase in damage)",
  },
  {
    id: 159,
    spa: 'SE_AllStats',
    effectName: 'All Stats',
    description:
      'Modify all base stats by percent. (STR, AGI, DEX, WIS, INT, CHA)',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: 'Effect currently handled entirely client side.',
  },
  {
    id: 160,
    spa: 'SE_MakeDrunk',
    effectName: 'Drunk',
    description: 'Intoxicate if tolerance under the base value.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
  },
  {
    id: 161,
    spa: 'SE_MitigateSpellDamage',
    effectName: 'Mitigate Spell Damage Rune',
    description:
      'Mitigate incoming spell damage by percentage until rune fades.',
    base: 'percent mitigation',
    limit: 'max damage absorbed per hit',
    max: 'rune amount',
    notes:
      'Special: If this effect is placed on item as worn effect or as an AA, it will provide stackable percent spell mitigation for the base value.',
  },
  {
    id: 162,
    spa: 'SE_MitigateMeleeDamage',
    effectName: 'Mitigate Melee Damage Rune',
    description:
      'Mitigate incoming melee damage by percentage until rune fades.',
    base: 'percent mitigation',
    limit: 'max damage absorbed per hit',
    max: 'rune amount',
    notes: '',
  },
  {
    id: 163,
    spa: 'SE_NegateAttacks',
    effectName: 'Absorb Damage',
    description: 'Complete or partially block incoming spell and melee damage',
    base: 'amount of blocked hits',
    limit: 'none',
    max: 'max amount of damage blocked per hit',
    notes: '',
  },
  {
    id: 164,
    spa: 'SE_AppraiseLDonChest',
    effectName: 'Sense LDoN Chest',
    description:
      'Attempt to sense the presence of a cursed trap on the targeted object.',
    base: 1,
    limit: 'none',
    max: 'skill check value',
    notes: '',
  },
  {
    id: 165,
    spa: 'SE_DisarmLDoNTrap',
    effectName: 'Disarm LDoN Trap',
    description: 'Attempt to disarm a cursed trap on the targeted object.',
    base: 1,
    limit: 'none',
    max: 'skill check value',
    notes: '',
  },
  {
    id: 166,
    spa: 'SE_UnlockLDoNChest',
    effectName: 'Unlock LDoN Chest',
    description:
      'Attempt to destroy any cursed lock present on the targeted object.',
    base: 1,
    limit: 'none',
    max: 'skill check value',
    notes: '',
  },
  {
    id: 167,
    spa: 'SE_PetPowerIncrease',
    effectName: 'Focus: Pet Power',
    description: 'Increase statistics and level of the pet when summoned.',
    base: 'power value',
    limit: 'none',
    max: 'none',
    notes:
      "Pet power can be scaled automatically if 'petpower' field in pets table is set to 0 or -1, if the power field is set to anything it will look to find the cooresponding pet in the table with same power for that 'type'.",
  },
  {
    id: 168,
    spa: 'SE_MeleeMitigation',
    effectName: 'Defensive',
    description: 'Modify incoming melee damage by percent.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: 'Negative base value decreases damage taken',
  },
  {
    id: 169,
    spa: 'SE_CriticalHitChance',
    effectName: 'Critical Melee Chance',
    description: 'Modify melee critical hit chance by skill.',
    base: 'percent modifer',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 170,
    spa: 'SE_SpellCritChance',
    effectName: 'Spell Critical Chance',
    description: 'Modifies spell critical chance by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Must have a chance to perform critical hits in order to have a chance to crippling blow.',
  },
  {
    id: 171,
    spa: 'SE_CrippBlowChance',
    effectName: 'Crippling Blow Chance',
    description: 'Modify melee crippling blow chance',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 172,
    spa: 'SE_AvoidMeleeChance',
    effectName: 'Evasion',
    description: 'Modify chance to avoid melee.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 173,
    spa: 'SE_RiposteChance',
    effectName: 'Riposte',
    description: 'Modify chance to riposte.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 174,
    spa: 'SE_DodgeChance',
    effectName: 'Dodge',
    description: 'Modify chance to dodge.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 175,
    spa: 'SE_ParryChance',
    effectName: 'Parry',
    description: 'Modify chance to parry.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 176,
    spa: 'SE_DualWieldChance',
    effectName: 'Dual Wield',
    description: 'Modify dual weild chance.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 177,
    spa: 'SE_DoubleAttackChance',
    effectName: 'Double Attack',
    description: 'Modify double attack chance.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: 'Positive value will heal you',
  },
  {
    id: 178,
    spa: 'SE_MeleeLifetap',
    effectName: 'Melee Lifetap',
    description: 'Heal for a percentage for your melee damage on target.',
    base: 'percentage',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 179,
    spa: 'SE_AllInstrumentMod',
    effectName: 'All Instrument Modifier',
    description:
      'Set modifier value for all instrument and singing modifers that will be used if higher then the respective item modifers.',
    base: 'modifier percentage',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 180,
    spa: 'SE_ResistSpellChance',
    effectName: 'Resist Spell Chance',
    description: 'Modify chance to resist incoming spells by percent.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 181,
    spa: 'SE_ResistFearChance',
    effectName: 'Resist Fear Spell Chance',
    description: 'Modify chance to resist incoming fear spells by percent.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 182,
    spa: 'SE_HundredHands',
    effectName: 'Attack Delay Reducation',
    description: 'Modify attack delay by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Negative value reduces delay, example -115 is calculated as a 15 percent reduction (-115/100). Positive value increases delay, 300 is calculated as a 30 percent increase in delay',
  },
  {
    id: 183,
    spa: 'SE_MeleeSkillCheck',
    effectName: 'Melee Skill Chance',
    description: 'Unknown intended effect.',
    base: 'percent chance',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: 'No longer used on live. It provides no benefits on eqemu.',
  },
  {
    id: 184,
    spa: 'SE_HitChance',
    effectName: 'Chance to Hit',
    description: 'Modify chance to hit by skill',
    base: 'percent modifer',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 185,
    spa: 'SE_DamageModifier',
    effectName: 'Skills Damage Modifier',
    description: 'Modify melee damage by skill.',
    base: 'percent modifer',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 186,
    spa: 'SE_MinDamageModifier',
    effectName: 'Skills Minimum Damage Modifier',
    description: 'Modify melee minimum damage by skill.',
    base: 'percent modifer',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 187,
    spa: 'SE_BalanceMana',
    effectName: 'Balance Party Mana',
    description:
      'Balances groups mana with a percent modifier to the damage being distributed.',
    base: 'percent modifer',
    limit: 'max mana taken from player',
    max: 'none',
    notes: 'Positive base value increases damage being distributed',
  },
  {
    id: 188,
    spa: 'SE_IncreaseBlockChance',
    effectName: 'Chance to block',
    description: 'Modify chance to block melee.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 189,
    spa: 'SE_CurrentEndurance',
    effectName: 'Endurance',
    description:
      'Modify targets endurance by amount, repeates every tic if in a buff.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
  },
  {
    id: 190,
    spa: 'SE_EndurancePool',
    effectName: 'Max Endurance',
    description: 'Modify max endurance pool by amount.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
  },
  {
    id: 191,
    spa: 'SE_Amnesia',
    effectName: 'Amnesia',
    description: 'Prevents disciplines use.',
    base: '1 (increase for stacking overwrite)',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 192,
    spa: 'SE_Hate',
    effectName: 'Hate',
    description:
      'Modify targets hate toward you by amount, repeates every tic if in a buff.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: '',
  },
  {
    id: 193,
    spa: 'SE_SkillAttack',
    effectName: 'Skill Attack',
    description:
      'Perform a combat round using a specific skill at a set weapon damage and chance to hit modifier.',
    base: 'weapon damage',
    limit: 'chance to hit modifier',
    max: 'unknown',
    notes:
      "Skill used to perform combat round is determined by the 'skill' field in spells table.",
  },
  {
    id: 194,
    spa: 'SE_FadingMemories',
    effectName: 'Fade',
    description:
      'Remove from hate lists and make invisible. Can set max level of NPCs that can be affected.',
    base: 'success chance',
    limit: 'max level (ROF2 era)',
    max: 'max level (modern era)',
    notes:
      'Support for max level requires Rule (Spells, UseFadingMemoriesMaxLevel) to be true. If used from limit field, then it set as the level, ie. max level of 75 would use limit value of 75. If set from max field, max level 75 would use max value of 1075, if you want to set it so it checks a level range above the spell target then for it to only work on mobs 5 levels or below you set max value to 5.',
  },
  {
    id: 195,
    spa: 'SE_StunResist',
    effectName: 'Stun Resist',
    description:
      'Modifies chance to resist a stun from a bash or kick by percent',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 196,
    spa: 'SE_StrikeThrough',
    effectName: 'Strikethrough',
    description:
      "Modify chance to strikethrough by percent, bypassing an opponent's special defenses, such as dodge, block, parry, and riposte",
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 197,
    spa: 'SE_SkillDamageTaken',
    effectName: 'Skill Damage Taken',
    description: 'Modify damage taken by percent from specific skill.',
    base: 'percent modifier',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 198,
    spa: 'SE_CurrentEnduranceOnce',
    effectName: 'Instant Endurance',
    description: 'Modify targets endurance by amount.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: 'Negative base value decreases damage taken',
  },
  {
    id: 199,
    spa: 'SE_Taunt',
    effectName: 'Taunt',
    description: 'Chance to taunt target and apply instant hate.',
    base: 'taunt success chance',
    limit: 'amount hate added',
    max: '',
    notes: '',
  },
  {
    id: 200,
    spa: 'SE_ProcChance',
    effectName: 'Worn Proc Chance',
    description: 'Modify worn weapon proc chance by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 201,
    spa: 'SE_RangedProc',
    effectName: 'Ranged Proc',
    description: 'Add proc to ranged attacks',
    base: 'spellid',
    limit: 'rate modifer',
    max: 'none',
    notes: '',
  },
  {
    id: 202,
    spa: 'SE_IllusionOther',
    effectName: 'Project Illusion',
    description:
      'Allows next casted self only illusion buff to be cast on a targeted player in group.',
    base: 'none',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 203,
    spa: 'SE_MassGroupBuff',
    effectName: 'Mass Group Buff',
    description:
      'Allows next casted Group Buff to hit all players and pets within a large radius from caster at double the mana cost.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 204,
    spa: 'SE_GroupFearImmunity',
    effectName: 'Group Fear Immunity',
    description: 'Provides immunity to fear for group.',
    base: 'duration',
    limit: 'none',
    max: 'none',
    notes:
      'Duration is calculated as base value * 10. Thus, value of 1 would be 10 seconds. This is not a buff and gives no icon.',
  },
  {
    id: 205,
    spa: 'SE_Rampage',
    effectName: 'AE Rampage',
    description:
      'Perform a primary slot combat rounds on all creatures within a 40 foot radius.',
    base: 'number of attack rounds',
    limit: 'max entities hit per round',
    max: 'aoe range override',
    notes:
      'On live base is always set to 1, if more than one attack is a spell it uses this SPA in multiple slots. Limit value can be used to set a max amount of entities able to be attacked per round.',
  },
  {
    id: 206,
    spa: 'SE_AETaunt',
    effectName: 'AE Taunt',
    description:
      "Taunts all creatures within a 40 foot radius, placing you 'base values' points of hate higher than your opponents' previously most hated target.",
    base: 'added hate',
    limit: 'none',
    max: 'aoe range override',
    notes: '',
  },
  {
    id: 207,
    spa: 'SE_FleshToBone',
    effectName: 'Flesh to Bone',
    description: 'Turns meat or body parts items into bone chips.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 208,
    spa: 'SE_PurgePoison',
    effectName: 'Purge Poison',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 209,
    spa: 'SE_DispelBeneficial',
    effectName: 'Dispel Beneficial',
    description: 'Dispels beneficial buffs.',
    base: 'percent chance x 10',
    limit: 'none',
    max: 'none',
    notes: 'Actual percent chance is calculated as base / 10',
  },
  {
    id: 210,
    spa: 'SE_PetShield',
    effectName: 'Pet Shield',
    description:
      "Allows pet to use 'shield ability' on owner to reduce 50 percent of damage taken by owner for duration",
    base: 'Duration multiplier 1=12 seconds, 2=24 ect',
    limit: 'mitigation on pet owner override',
    max: 'mitigation on pet overide',
    notes:
      'Special: limit and max values are not on live, they can be used to give mitigation penalties or bonuses to shielder or shielded.',
  },
  {
    id: 211,
    spa: 'SE_AEMelee',
    effectName: 'AE Melee',
    description:
      'Perform a primary slot combat rounds on all creatures within a 40 foot radius for a duration.',
    base: 'Duration multiplier 1=12 seconds, 2=24 ect',
    limit: 'none',
    max: 'none',
    notes: 'Only implemented for clients.',
  },
  {
    id: 212,
    spa: 'SE_FrenziedDevastation',
    effectName: 'Frenzied Devastation',
    description:
      'Increase spell critical chance and while present all direct damage spells cost double the amount of mana.',
    base: 1,
    limit: 'chance modifier',
    max: 'none',
    notes:
      'Live no longer uses the effect in this way. It is now a focus effect.',
  },
  {
    id: 213,
    spa: 'SE_PetMaxHP',
    effectName: 'Pet Max HP',
    description: 'Modifies your pets maximum HP by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 214,
    spa: 'SE_MaxHPChange',
    effectName: 'Change Max HP',
    description: 'Modify your maximum HP by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Base value is divided by 100 to get actual percentage. Example, for 10 percent max HP increase, base value should be 1000.',
  },
  {
    id: 215,
    spa: 'SE_PetAvoidance',
    effectName: 'Pet Avoidance',
    description: 'Modifies your pets chance to avoid melee by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 216,
    spa: 'SE_Accuracy',
    effectName: 'Accuracy',
    description: 'Modify your chance to hit by modifying accuracy by amount.',
    base: 'amount accuracy',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes:
      'AA version of this is not skill limited. Differs from SPA 184, which is a multiplier of your total accuracy.',
  },
  {
    id: 217,
    spa: 'SE_HeadShot',
    effectName: 'Headshot',
    description:
      'Grants your archery attacks a chance to deal extra damage to humanoid NPC targets.',
    base: 'percent chance',
    limit: 'damage amount',
    max: 'none',
    notes:
      'Used with SPA 346 which limits headshot by level and adds a bonus chance.',
  },
  {
    id: 218,
    spa: 'SE_PetCriticalHit',
    effectName: 'Pet Crit Melee',
    description:
      'Modifies your pets chance to perform a critical melee hit by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 219,
    spa: 'SE_SlayUndead',
    effectName: 'Slay Undead',
    description: 'Chance to do increased damage verse undead.',
    base: 'damage percent modifier',
    limit: 'chance',
    max: 'none',
    notes:
      'Actual chance will be your limit value / 10. Example a 14 percent chance would require limit value of 140. Damage modifier baseline is 100, Base greater than 100 for increased damage (120 = 20 pct damage increase)',
  },
  {
    id: 220,
    spa: 'SE_SkillDamageAmount',
    effectName: 'Skill Damage Bonus',
    description:
      'Add a flat amount of damage when a specific melee skill is used.',
    base: 'amount',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 221,
    spa: 'SE_Packrat',
    effectName: 'Reduce Weight',
    description: 'Modify weight of your inventory by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 222,
    spa: 'SE_BlockBehind',
    effectName: 'Block Behind',
    description: 'Modify chance to block from behind.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 223,
    spa: 'SE_DoubleRiposte',
    effectName: 'Double Riposte',
    description:
      'Chance to do an additional riposte attack after a successful riposte.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: 'No longer used on live.',
  },
  {
    id: 224,
    spa: 'SE_GiveDoubleRiposte',
    effectName: 'Additional Riposte',
    description:
      'Chance to do an additional riposte attack, or skill based riposte like Flying Kick.',
    base: 'percent chance',
    limit: 'skill type',
    max: 'none',
    notes:
      "If limit value is set you can riposte using a specific special attack skill, like 'flying kick'. You can not have multiple skills that can riposte, thus limited to use in only one effect.",
  },
  {
    id: 225,
    spa: 'SE_GiveDoubleAttack',
    effectName: 'Double Attack',
    description:
      'Allows any class to double attack at a set percent chance or modifty chance if class can innately double attack.',
    base: 'percent chance or modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 226,
    spa: 'SE_TwoHandBash',
    effectName: 'Two Hand bash',
    description: 'Bash with a two handed weapon.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: 'Handled client side.',
  },
  {
    id: 227,
    spa: 'SE_ReduceSkillTimer',
    effectName: 'Base Refresh Timer',
    description: 'Reduce base refresh timer of skill',
    base: 'time seconds (positive)',
    limit: 'skill type',
    max: 'none',
    notes: '',
  },
  {
    id: 228,
    spa: 'SE_ReduceFallDamage',
    effectName: 'Reduce Fall Dmg',
    description: 'Reduce the damage that you take from falling by percent.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 229,
    spa: 'SE_PersistantCasting',
    effectName: 'Cast Through Stun',
    description: 'Chance to continue casting while stunned.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 230,
    spa: 'SE_ExtendedShielding',
    effectName: 'Increase Shield Distance',
    description:
      'Modify the range of your /shield ability by an amount of distance',
    base: 'distance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 231,
    spa: 'SE_StunBashChance',
    effectName: 'Stun Bash Chance',
    description: 'Modify chance to land a stun using bash skill by percent',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 232,
    spa: 'SE_DivineSave',
    effectName: 'Divine Save',
    description:
      'Chance to return to life with the blessing Touch of the Divine when you would otherwise die.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'none',
    notes:
      'This effect triggers upon death, where base value gives you percent chance to cast Touch of the Divine which is an Invulnerability, heal, HoT and purify effect. Limit value can be used to add an additional spell being applied on death, usually this is a heal.',
  },
  {
    id: 233,
    spa: 'SE_Metabolism',
    effectName: 'Metabolism',
    description: 'Modifies food and drink consumption rates.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: 'Positive value decreases consumption rate',
  },
  {
    id: 234,
    spa: 'SE_ReduceApplyPoisonTime',
    effectName: 'Poison Mastery',
    description: 'Decrease poison application time.',
    base: 'time',
    limit: 'none',
    max: 'none',
    notes:
      'Reducation time calculated as base /1000. Example, 2.5 second reduction would be a base value of 2500.',
  },
  {
    id: 235,
    spa: 'SE_ChannelChanceSpells',
    effectName: 'Focus Channelling',
    description:
      'Modify chance to channel a spell and avoid being interupted by percent.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: 'No longer used on live.',
  },
  {
    id: 236,
    spa: 'SE_FreePet',
    effectName: 'Free Pet',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 237,
    spa: 'SE_GivePetGroupTarget',
    effectName: 'Pet Affinity',
    description: 'Allows summoned pets to receive group buffs.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 238,
    spa: 'SE_IllusionPersistence',
    effectName: 'Permanent Illusion',
    description:
      'Illusions will persist through zoning and last up to 16 hours. If base value increased to two, will persist through death.',
    base: '1 or 2',
    limit: 'none',
    max: 'none',
    notes: '1=Persist through zoning, 2=Persist through death',
  },
  {
    id: 239,
    spa: 'SE_FeignedCastOnChance',
    effectName: 'Feign Death Through Spell Hit',
    description: 'Chance to feign death through spell hit.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: 'If spell is resisted your chance is multipled by two.',
  },
  {
    id: 240,
    spa: 'SE_StringUnbreakable',
    effectName: 'String Unbreakable',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 241,
    spa: 'SE_ImprovedReclaimEnergy',
    effectName: 'Improve Reclaim Energy',
    description:
      'Modify amount of mana returned from from reclaim energy by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 242,
    spa: 'SE_IncreaseChanceMemwipe',
    effectName: 'Increase Chance Memwipe',
    description: 'Modify the chance to wipe hate with memory blurr by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Actual chance to memory blur is much higher than the memory blurs spells base value, caster level and CHA modifiers are added get the final calculated percent chance. This effect modifiers that final percent chance.',
  },
  {
    id: 243,
    spa: 'SE_CharmBreakChance',
    effectName: 'Charm Break Chance',
    description: 'Modify chance of charm breaking early by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 244,
    spa: 'SE_RootBreakChance',
    effectName: 'Root Break Chance',
    description:
      'Modify chance of the casters root being broken by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Modifies the base line root break chance. The benefit is given to any player casting on that NPC with the root, opposed to only the caster of the root.',
  },
  {
    id: 245,
    spa: 'SE_TrapCircumvention',
    effectName: 'Trap Circumvention',
    description:
      'Decreases the chance that you will set off a trap when opening a chest or other similar container by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 246,
    spa: 'SE_SetBreathLevel',
    effectName: 'Lung Capacity',
    description:
      'Modify the amount of air you can hold in your lungs by percent',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: 'Should work client side. No server side support.',
  },
  {
    id: 247,
    spa: 'SE_RaiseSkillCap',
    effectName: 'Increase SkillCap',
    description: 'Increase skill cap.',
    base: 'amount',
    limit: 'skill type',
    max: 'none',
    notes: '',
  },
  {
    id: 248,
    spa: 'SE_SecondaryForte',
    effectName: 'Extra Specialization',
    description:
      'Gives you a second specialize skill that can go past 50 to 100.',
    base: 100,
    limit: 'none',
    max: 'none',
    notes: 'Changing base value will not alter this effect.',
  },
  {
    id: 249,
    spa: 'SE_SecondaryDmgInc',
    effectName: 'Offhand Min Damage Bonus',
    description: 'Modify offhand weapons minimum damage bonus by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 250,
    spa: 'SE_SpellProcChance',
    effectName: 'Spell Proc Chance',
    description:
      'Modify proc chance of combat procs gained by spells or AAs by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 251,
    spa: 'SE_ConsumeProjectile',
    effectName: 'Endless Quiver',
    description:
      'Chance not to consume a projectile when usimg archery or throwing skill.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 252,
    spa: 'SE_FrontalBackstabChance',
    effectName: 'Backstab from Front',
    description:
      'Chance to perform a full backstab while in front of the target.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 253,
    spa: 'SE_FrontalBackstabMinDmg',
    effectName: 'Chaotic Stab',
    description: 'Allow a frontal backstab for mininum damage.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 254,
    spa: 'SE_Blank',
    effectName: null,
    // effectName: 'No Spell',
    description: 'Default value for an unused effect slot.',
    base: 'none',
    limit: 'none',
    max: 'none',
    notes: 'Do not replace this effect.',
  },
  {
    id: 255,
    spa: 'SE_ShieldDuration',
    effectName: 'Shielding Duration',
    description: 'Extends the duration of your /shield ability.',
    base: 'seconds',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 256,
    spa: 'SE_ShroudofStealth',
    effectName: 'Shroud Of Stealth',
    description: 'Rogue improved invsible.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 257,
    spa: 'SE_PetDiscipline',
    effectName: 'Give Pet Hold',
    description: 'Gives pet command, pet /hold',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      'SPA 267 with a limit value of 15 is required now to obtain pet /hold.',
  },
  {
    id: 258,
    spa: 'SE_TripleBackstab',
    effectName: 'Triple Backstab',
    description: 'Chance to perform a triple backstab.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 259,
    spa: 'SE_CombatStability',
    effectName: 'AC Softcap Limit',
    description: 'Modify AC soft cap by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 260,
    spa: 'SE_AddSingingMod',
    effectName: 'Instrument Modifier',
    description:
      'Set modifier value a specific instrument/singing skills that will be used if higher then the respective item modifier for that skill.',
    base: 'percent modifier',
    limit: 'Item Type ID',
    max: 'none',
    notes:
      'Item Type IDs, 23=Woodwind, 24=Strings, 25=Brass, 26=Percussions, 50=Singing, 51=All instruments',
  },
  {
    id: 261,
    spa: 'SE_SongModCap',
    effectName: 'Song Cap',
    description: 'Modify max song modifier cap by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes:
      "Song cap is set in spells table as field 'song_cap'. Not used on live.",
  },
  {
    id: 262,
    spa: 'SE_RaiseStatCap',
    effectName: 'Raise Stat Cap',
    description: 'Modify stat cap type by amount.',
    base: 'amount',
    limit: 'stat type id',
    max: 'none',
    notes:
      'Stat type id, STR=0, STA=1, AGI=2, DEX=3, WIS=4, INT=5, CHA=6, MR=7, CR=8, FR=9, PR=10, DR=11, COR=12',
  },
  {
    id: 263,
    spa: 'SE_TradeSkillMastery',
    effectName: 'Tradeskill Masteries',
    description:
      'Allows you to raise additional standard tradeskill (Baking, Blacksmithing, Brewing, Fletching, Jewelcraft, Pottery, or Tailoring) from its initial Specialization cap of 200 up to 250.',
    base: 'amount of skills that can be raised (max=6)',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 264,
    spa: 'SE_HastenedAASkill',
    effectName: 'Reduce AA Timer',
    description: 'Reduces reuse time on AA skills.',
    base: 'reducation amount seconds',
    limit: 'aa id',
    max: 'none',
    notes: 'This can be only set as an AA ability.',
  },
  {
    id: 265,
    spa: 'SE_MasteryofPast',
    effectName: 'No Fizzle',
    description:
      'Makes it impossible for you to fizzle spells at our below the spell level specified by the base value.',
    base: 'level',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 266,
    spa: 'SE_ExtraAttackChance',
    effectName: 'Add Extra Attack: 2H Primary',
    description:
      'Gives your double attacks a percent chance to perform an extra attack with 2-handed primary weapon.',
    base: 'percent chance',
    limit: 'number of attacks',
    max: 'none',
    notes: '',
  },
  {
    id: 267,
    spa: 'SE_AddPetCommand',
    effectName: 'Add Pet Commands',
    description:
      'Enables multilpe different pet commands based on limit value.',
    base: 1,
    limit: 'pet command type',
    max: 'none',
    notes: 'Full list of command types found in common.h',
  },
  {
    id: 268,
    spa: 'SE_ReduceTradeskillFail',
    effectName: 'Tradeskill Failure Rate',
    description: 'Modify chance to fail with given tradeskill by a percent.',
    base: 'chance modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 269,
    spa: 'SE_MaxBindWound',
    effectName: 'Bandage Percent Limit',
    description: 'Modify max HP you can bind wound by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 270,
    spa: 'SE_BardSongRange',
    effectName: 'Bard Song Range',
    description: 'Modify range of beneficial bard songs by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 271,
    spa: 'SE_BaseMovementSpeed',
    effectName: 'Base Run Speed',
    description: 'Modify base rune speed by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: 'Does not stack with run speed modifiers.',
  },
  {
    id: 272,
    spa: 'SE_CastingLevel2',
    effectName: 'Casting Level',
    description: 'Modify effective casting level by amount.',
    base: 'level amount',
    limit: 'none',
    max: 'none',
    notes:
      'Live decription: This affects, spells that get stronger or last longer based on your level, stacking priority on targets, likelihood that spells that dispel effects will succeed, likelihood that spells that cure blindness will succeed, likelihood that spells that sense, disarm, or pick locked traps will succeed.',
  },
  {
    id: 273,
    spa: 'SE_CriticalDoTChance',
    effectName: 'Critical DoT',
    description: 'Modifies chance to critical damage over time spells.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 274,
    spa: 'SE_CriticalHealChance',
    effectName: 'Critical Heal',
    description: 'Modify chance to critical heal spells.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 275,
    spa: 'SE_CriticalMend',
    effectName: 'Critical Mend',
    description: 'Modify chance to critical the monks mend ability.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 276,
    spa: 'SE_Ambidexterity',
    effectName: 'Dual Wield Skill Amount',
    description:
      'Modify your chance to successfully dual wield by increasing dual weild skill by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 277,
    spa: 'SE_UnfailingDivinity',
    effectName: 'Extra DI Chance',
    description:
      'Gives second chance for a death save to fire and if successful gives a modified heal amount.',
    base: 'heal modifier percent',
    limit: 'none',
    max: 'none',
    notes: 'This works with Death Save SPA 150.',
  },
  {
    id: 278,
    spa: 'SE_FinishingBlow',
    effectName: 'Finishing Blow',
    description:
      'Grants melee attacks a chance to deal massive damage to NPC targets with 10% or less health.',
    base: 'percent chance',
    limit: 'damage amount',
    max: 'none',
    notes:
      'Actual chance is calculated as base value / 10. Example for 50 percent chance, set base to 500. Use with SPA 440 to set max level of NPC that can be affected by finishing blow.',
  },
  {
    id: 279,
    spa: 'SE_Flurry',
    effectName: 'Flurry Chance',
    description: 'Chance to do a melee flurry, performing two extra attacks.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 280,
    spa: 'SE_PetFlurry',
    effectName: 'Pet Flurry Chance',
    description: 'Chance for pet to perform a melee flurry.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 281,
    spa: 'SE_FeignedMinion',
    effectName: 'Give Pet Feign',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 282,
    spa: 'SE_ImprovedBindWound',
    effectName: 'Bandage Amount',
    description: 'Modify bind wound healing amount by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 283,
    spa: 'SE_DoubleSpecialAttack',
    effectName: 'Special Attack Chain',
    description: 'Chance to perform second special skill attack as monk.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 284,
    spa: 'SE_LoHSetHeal',
    effectName: 'LoH Set Heal',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 285,
    spa: 'SE_NimbleEvasion',
    effectName: 'NoMove Check Sneak',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 286,
    spa: 'SE_FcDamageAmt',
    effectName: 'Focus: Spell Damage Amount',
    description: 'Modify spell damage by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: buildEffectText(
        'Spell Damage',
        spell,
        effectIndex,
        itemEffectLevel,
      ),
    }),
  },
  {
    id: 287,
    spa: 'SE_SpellDurationIncByTic',
    effectName: 'Focus: Buff Duration by Tics',
    description: 'Modify spell buff duration by tics.',
    base: 'duration tics',
    limit: 'none',
    max: 'none',
    notes: '1 tic = 6 seconds, set base in tics',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => ({
      text: `Increase Buff Duration by ${formatTime(getBaseValue(spell, effectIndex) * 6000)}`,
    }),
  },
  {
    id: 288,
    spa: 'SE_SkillAttackProc',
    effectName: 'Add Proc From Skill Attack',
    description: 'Chance to cast a spell when a skill attack is performed.',
    base: 'chance percent',
    limit: 'skill type',
    max: 'none',
    notes:
      "Chance is calculated as base value / 10, example 20 percent chance would be a value of 200. For AA's the proc spell ID is the 'spell' field used in the aa_ranks table.",
  },
  {
    id: 289,
    spa: 'SE_CastOnFadeEffect',
    effectName: 'Cast Spell On Fade',
    description:
      'Cast a spell only if buff containing this effect fades after the full duration.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: 'Typically seen on spells that can be cured.',
  },
  {
    id: 290,
    spa: 'SE_IncreaseRunSpeedCap',
    effectName: 'Movement Cap',
    description: 'Increase movement speed cap.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 291,
    spa: 'SE_Purify',
    effectName: 'Purify',
    description:
      'Remove up specified amount of detiremental spells, excluding charm, fear, resurrection, and revival sickness.',
    base: 'amount spells removed',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 292,
    spa: 'SE_StrikeThrough2',
    effectName: 'Strikethrough (v292)',
    description:
      "Modify chance to strikethrough by percent, bypassing an opponent's special defenses, such as dodge, block, parry, and riposte",
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 293,
    spa: 'SE_FrontalStunResist',
    effectName: 'Frontal Stun Resist',
    description:
      'Chance to resist a stun from a bash or kick if facing target.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 294,
    spa: 'SE_CriticalSpellChance',
    effectName: 'Spell Crit Chance',
    description:
      'Modify chance to critical direct damage spells and modify spell critical spell damage by percent',
    base: 'critical chance',
    limit: 'critical damage percent modifier',
    max: 'none',
    notes: '',
  },
  {
    id: 295,
    spa: 'SE_ReduceTimerSpecial',
    effectName: 'Reduce Timer Special',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 296,
    spa: 'SE_FcSpellVulnerability',
    effectName: 'Focus: Incoming Spell Damage',
    description: 'Modify incoming spell damage taken by percent.',
    base: 'min percent modifier',
    limit: 'none',
    max: 'max percent modifier',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Damage Taken',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 297,
    spa: 'SE_FcDamageAmtIncoming',
    effectName: 'Focus: Incoming Spell Damage Amt',
    description: 'Modify incoming spell damage taken by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 298,
    spa: 'SE_ChangeHeight',
    effectName: 'Pet Size',
    description: 'Modify size by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 299,
    spa: 'SE_WakeTheDead',
    effectName: 'Wake the Dead',
    description: 'Create temporary pet from nearby corpses.',
    base: 1,
    limit: 'none',
    max: 'duration seconds',
    notes: 'Maximum range for corpse from caster is 250 units.',
  },
  {
    id: 300,
    spa: 'SE_Doppelganger',
    effectName: 'Doppelganger',
    description: 'Create a temporary pets that mirrors you appearance.',
    base: 'amount of pets',
    limit: 'none',
    max: 'duration seconds',
    notes: '',
  },
  {
    id: 301,
    spa: 'SE_ArcheryDamageModifier',
    effectName: 'Archery Damage Modifer',
    description: 'Modify archery base damage by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 302,
    spa: 'SE_FcDamagePctCrit',
    effectName: 'Focus: Spell Damage (v302 before crit)',
    description:
      'Modify spell damage by percent. Damage is applied before critical calculation.',
    base: 'min percent modifier',
    limit: 'none',
    max: 'max percent modifier',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Damage Taken (before crit)',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 303,
    spa: 'SE_FcDamageAmtCrit',
    effectName: 'Focus: Spell Damage Amt (v303 before crit)',
    description:
      'Modify spell damage by a flat amount. Damage is applied before critical calculation..',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 304,
    spa: 'SE_OffhandRiposteFail',
    effectName: 'Secondary Riposte',
    description: 'Modify chance to avoid an offhand riposte by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 305,
    spa: 'SE_MitigateDamageShield',
    effectName: 'Damage Shield Mitigation',
    description:
      'Modify incoming damage from damage shield using your off hand weapon by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes:
      "For spells/items set to positive value will reduce the damage shield amount, for AA's set this value to negative for reducation, this is converted to positive in source code. This is how live has it.",
  },
  {
    id: 306,
    spa: 'SE_ArmyOfTheDead',
    effectName: 'Army of the Dead',
    description:
      'Create temporary pets from nearby corpses. Can only spawn one pet per corpse up a maximum amount of pets.',
    base: 'amount of pets',
    limit: 'none',
    max: 'duration seconds',
    notes: 'Maximum range for corpse from caster is 250 units.',
  },
  {
    id: 307,
    spa: 'SE_Appraisal',
    effectName: 'Appraisal',
    description:
      'Roughly estimates the selling price of the item you are holding.',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 308,
    spa: 'SE_ZoneSuspendMinion',
    effectName: 'Zone Suspend Minion',
    description: 'Allow suspended pets to be resummoned upon zoning.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 309,
    spa: 'SE_GateCastersBindpoint',
    effectName: "Gate Caster's Bindpoint",
    description: 'Teleports target or group members to casters bind point.',
    base: 'bind id (Set to 1, 2, or 3)',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 310,
    spa: 'SE_ReduceReuseTimer',
    effectName: 'Decrease Reuse Timer',
    description: 'Reduce spell recast time and disciple reuse time by amount.',
    base: 'time ms',
    limit: 'none',
    max: 'none',
    notes:
      'Positive value reduces reuse timer. Note: You can set to negative to increase reuse timer, but client will not display it properly.',
  },
  {
    id: 311,
    spa: 'SE_LimitCombatSkills',
    effectName: 'Limit: Combat Skills Not Allowed',
    description:
      'Include or exclude combat skills or procs from being focused.',
    base: '0=Exclude if proc 1=Allow only if proc',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 312,
    spa: 'SE_Sanctuary',
    effectName: 'Sanctuary',
    description:
      'Places caster at bottom hate list, effect fades if caster casts spell on targets other than self.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 313,
    spa: 'SE_ForageAdditionalItems',
    effectName: 'Forage Master',
    description: 'Chance to forage additional items using forage ability.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 314,
    spa: 'SE_Invisibility2',
    effectName: 'Improved Invisibility',
    description: 'Apply invsibility that will last until duration ends',
    base: 'invisibility level',
    limit: 'none',
    max: 'none',
    notes:
      'Invisibility level determines what level of see invisible can detect it.',
  },
  {
    id: 315,
    spa: 'SE_InvisVsUndead2',
    effectName: 'Improved Invisibility Vs Undead',
    description:
      'Apply invsibility verse undead that will last until duration ends',
    base: 'invisibility level',
    limit: 'none',
    max: 'none',
    notes:
      'Invisibility level determines what level of see invisible can detect it.',
  },
  {
    id: 316,
    spa: 'SE_ImprovedInvisAnimals',
    effectName: 'Improved Invisibility Vs Animals',
    description:
      'Apply invsibility verse animal that will last until duration ends',
    base: 'invisibility level',
    limit: 'none',
    max: 'none',
    notes:
      'Invisibility level determines what level of see invisible can detect it.',
  },
  {
    id: 317,
    spa: 'SE_ItemHPRegenCapIncrease',
    effectName: 'Worn Regen Cap',
    description: 'Increase HP regen from items over cap by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 318,
    spa: 'SE_ItemManaRegenCapIncrease',
    effectName: 'Worn Mana Cap',
    description: 'Increase Mana regen from items over cap by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 319,
    spa: 'SE_CriticalHealOverTime',
    effectName: 'Critical HP Regen',
    description:
      'Modifies chance to perform a critical heal over time by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 320,
    spa: 'SE_ShieldBlock',
    effectName: 'Shield Block Chance',
    description: 'Chance to block an attack while shield is equiped.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 321,
    spa: 'SE_ReduceHate',
    effectName: 'Reduce Target Hate',
    description: 'Remove or add a set amount of hate instantly from target.',
    base: 'amount',
    limit: 'none',
    max: 'max amount',
    notes: 'Positive value decreases hate.',
  },
  {
    id: 322,
    spa: 'SE_GateToHomeCity',
    effectName: 'Gate to Starting City',
    description: 'Gate to original starting city.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 323,
    spa: 'SE_DefensiveProc',
    effectName: 'Add Defensive Proc',
    description: 'Add defensive proc that triggers from incoming melee hits.',
    base: 'spellid',
    limit: 'rate modifer',
    max: 'none',
    notes: '',
  },
  {
    id: 324,
    spa: 'SE_HPToMana',
    effectName: 'HP for Mana',
    description:
      'Casted spells will use HP instead of Mana with a conversion penalty rate.',
    base: 'conversion rate percent',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 325,
    spa: 'SE_NoBreakAESneak',
    effectName: 'No Break AE Sneak',
    description: 'Chance to remain hidden when hit by an area effect spell.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 326,
    spa: 'SE_SpellSlotIncrease',
    effectName: 'Spell Slots',
    description: 'Increase spell gems by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Client has to support the value you use.',
  },
  {
    id: 327,
    spa: 'SE_MysticalAttune',
    effectName: 'Buff Slots',
    description: 'Increase max spell buff slots amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Client has to support the value you use.',
  },
  {
    id: 328,
    spa: 'SE_DelayDeath',
    effectName: 'Negative HP Limit',
    description:
      'Increases the amount of damage you can take before dying after falling unconscious at 0 health.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Positive value to increase effective negative hit points.',
  },
  {
    id: 329,
    spa: 'SE_ManaAbsorbPercentDamage',
    effectName: 'Mana Shield Absorb Damage',
    description:
      'Reduces incoming damage by percent and converts that amount to mana loss.',
    base: 'mitigation percent',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 330,
    spa: 'SE_CriticalDamageMob',
    effectName: 'Critical Melee Damage',
    description: 'Modifies damage done from a critical melee hit by percent.',
    base: 'percent modifier',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 331,
    spa: 'SE_Salvage',
    effectName: 'Item Recovery',
    description: 'Modify chance to salvage from tradeskills by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: 'Positive values increase chance to salvage',
  },
  {
    id: 332,
    spa: 'SE_SummonToCorpse',
    effectName: 'Summon to Corpse',
    description:
      'Summons a player back to their corpse but does not restore any lost experience. Coprse can still be resurrected.',
    base: 'seen 0 or 1',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 333,
    spa: 'SE_CastOnRuneFadeEffect',
    effectName: 'Trigger Spell On Rune Fade',
    description: 'Cast a spell when rune amount is used up and fades.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: 'This effect needs to go on a spell containing a rune effect.',
  },
  {
    id: 334,
    spa: 'SE_BardAEDot',
    effectName: 'Bard AE Dot',
    description:
      'Use on area of effect damage over time songs. Damage is only done if target is not moving.',
    base: 'amount',
    limit: 'none',
    max: 'amount max',
    notes: '',
  },
  {
    id: 335,
    spa: 'SE_BlockNextSpellFocus',
    effectName: 'Focus: Block Next Spell',
    description: 'Chance to block next spell that meets the focus limits.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 336,
    spa: 'SE_IllusionaryTarget',
    effectName: 'Illusionary Target',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 337,
    spa: 'SE_PercentXPIncrease',
    effectName: 'Experience',
    description: 'Modify amount of experience gained.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 338,
    spa: 'SE_SummonAndResAllCorpses',
    effectName: 'Expedient Recovery',
    description: 'Summon and ressurect all corpses for 100% experience.',
    base: 'Seen at 70',
    limit: '',
    max: '',
    notes: 'Unknown what base value represents.',
  },
  {
    id: 339,
    spa: 'SE_TriggerOnCast',
    effectName: 'Focus: Trigger on Cast',
    description:
      'Chance to cast an additional spell on the target when the spell you are casting meets the focus limits.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'none',
    notes: '',
  },
  {
    id: 340,
    spa: 'SE_SpellTrigger',
    effectName: 'Spell Trigger: Only One Spell Cast',
    description:
      'Chance to cast a spell on the target. When multiple of this effects are present, only one is cast.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'none',
    notes:
      'When multiple of this effect exist on the same spell, only one spell will be selected from the list to be cast. For best results, the total percent chance should equal 100%. Example, Slot 1: Cast Ice Nuke 20%, Slot2: Cast Fire Nuke 50%, Slot3 Cast Magic Nuke 30%. When the spell is cast, only one of these spells be triggered on the target.',
  },
  {
    id: 341,
    spa: 'SE_ItemAttackCapIncrease',
    effectName: 'Worn Attack Cap',
    description: 'Increase ATK from items over cap by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 342,
    spa: 'SE_ImmuneFleeing',
    effectName: 'Prevent Flee on Low Health',
    description: 'Prevent NPC from fleeing at low health.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 343,
    spa: 'SE_InterruptCasting',
    effectName: 'Spell Interrupt',
    description:
      'Chance to interrupt targets spell casting can be instant or per buff tick.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 344,
    spa: 'SE_ChannelChanceItems',
    effectName: 'Item Channeling',
    description:
      'Modify chance to channel a spell from items and avoid being interupted by percent.',
    base: 'percent modifer',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 345,
    spa: 'SE_AssassinateLevel',
    effectName: 'Assassinate Max Level',
    description: 'Set max target level and bonus proc chance for assissinate.',
    base: 'max target level',
    limit: 'proc chance bonus',
    max: 'none',
    notes: '',
  },
  {
    id: 346,
    spa: 'SE_HeadShotLevel',
    effectName: 'Headshot Max Level',
    description: 'Set max target level and bonus proc chance for assissinate.',
    base: 'max target level',
    limit: 'proc chance bonus',
    max: 'none',
    notes: '',
  },
  {
    id: 347,
    spa: 'SE_DoubleRangedAttack',
    effectName: 'Double Ranged Attack',
    description: 'Chance to perform an additional ranged attack.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: 'Will consume an additional ammo item.',
  },
  {
    id: 348,
    spa: 'SE_LimitManaMin',
    effectName: 'Limit: Min Mana',
    description: 'Mininum mana of spell that can be focused.',
    base: 'mana amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 349,
    spa: 'SE_ShieldEquipDmgMod',
    effectName: 'Damage With Shield',
    description:
      'Modify melee damage and hate when having a shield equiped by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 350,
    spa: 'SE_ManaBurn',
    effectName: 'Manaburn',
    description:
      'Instantly drains mana for damage at a defined ratio up to a defined maximum amount of mana.',
    base: 'max amount of mana drained',
    limit: 'percent of mana converted to damage',
    max: 'none',
    notes: 'Limit value if set to negative will result in damage',
  },
  {
    id: 351,
    spa: 'SE_PersistentEffect',
    effectName: 'Persistent Effect',
    description:
      'Create an aura that will provide a persistent effect around your character.',
    base: 'unknown',
    limit: 'none',
    max: 'unknown',
    notes:
      "Set 'Teleport Zone' field to be the same as 'name' field in of the pet you want in the auras table.",
  },
  {
    id: 352,
    spa: 'SE_IncreaseTrapCount',
    effectName: 'Trap Count',
    description: 'Increase trap count by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 353,
    spa: 'SE_AdditionalAura',
    effectName: 'Aura Count',
    description: 'Increase aura count by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 354,
    spa: 'SE_DeactivateAllTraps',
    effectName: 'Deactivate All Traps',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 355,
    spa: 'SE_LearnTrap',
    effectName: 'Learn Trap',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 356,
    spa: 'SE_ChangeTriggerType',
    effectName: 'Change Trigger Type',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 357,
    spa: 'SE_FcMute',
    effectName: 'Focus: Mute',
    description: 'Chance to prevents casting of spell if limits are met.',
    base: 'chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 358,
    spa: 'SE_CurrentManaOnce',
    effectName: 'Mana Once',
    description: 'Modify mana by amount. Instant only.',
    base: 'amount',
    limit: 'none',
    max: 'max amount (use positive value)',
    notes: '',
  },
  {
    id: 359,
    spa: 'SE_PassiveSenseTrap',
    effectName: 'Passive Sense Trap',
    description:
      'Grants you a chance to innately sense traps when you near them.T his passive chance is only half as effective as your active Sense Trap skill.',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 360,
    spa: 'SE_ProcOnKillShot',
    effectName: 'Trigger Spell On Kill Shot',
    description:
      'Chance to cast a spell if you are the one responsible for the death of a challenging foe.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'minimum target level',
    notes: 'Typical use case is a self only buff when triggered.',
  },
  {
    id: 361,
    spa: 'SE_SpellOnDeath',
    effectName: 'Trigger Spell On Death',
    description:
      'Chance to casts a spell when the entity with this effect is killed.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'none',
    notes:
      'Typical use case is casting an area of effect upon death. Placing self only beneficial spells such as heals will not work due to player already being dead.',
  },
  {
    id: 362,
    spa: 'SE_PotionBeltSlots',
    effectName: 'Potion Belt Slots',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 363,
    spa: 'SE_BandolierSlots',
    effectName: 'Bandolier Slots',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 364,
    spa: 'SE_TripleAttackChance',
    effectName: 'Triple Attack Chance',
    description: 'Modify chance to triple attack by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 365,
    spa: 'SE_ProcOnSpellKillShot',
    effectName: 'Trigger Spell on Spell Kill Shot',
    description:
      'Chance to cast a spell when your target is killed and the kill is caused by the specific spell with this effect in it.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'none',
    notes: 'This effect is typical found on direct damage spells.',
  },
  {
    id: 366,
    spa: 'SE_GroupShielding',
    effectName: 'Group Shielding',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 367,
    spa: 'SE_SetBodyType',
    effectName: 'Modify Body Type',
    description: 'Set body type of target.',
    base: 'body type',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 368,
    spa: 'SE_FactionMod',
    effectName: 'Modify Faction',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 369,
    spa: 'SE_CorruptionCounter',
    effectName: 'Corruption Counter',
    description:
      'Determines potency of determental corruption spells or potency of cures.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: 'Set to positive values for potency of detrimental spells',
  },
  {
    id: 370,
    spa: 'SE_ResistCorruption',
    effectName: 'Corruption Resist',
    description: 'Modify fire corruption by amount',
    base: 'amout',
    limit: 'none',
    max: 'max amount',
    notes: '',
  },
  {
    id: 371,
    spa: 'SE_AttackSpeed4',
    effectName: 'Attack Speed: Inhibit Melee',
    description:
      'Decrease the remaining portion of your targets attack speed value not lowered by standard slows, this stacks with other slow effects.',
    base: 'slow amount',
    limit: 'none',
    max: 'none',
    notes:
      "This effect works differently than other slows. Base should always be positive. Example: (SPA 11) Sha's Legacy 65% slow + (SPA 371) Lassitude 25% slow, Sha's Legacy is calculated as 100 - 35 = 65% slow, therefore the remaining attack speed is (35). Lassitude will now decrease the remaining value (35) by 25% = 16.5%. The total slowed value on the target would be 65% + 16.5% = 81.25% slow. If SPA 371 is only slow effect on target, then it will be slowed for full base value.",
  },
  {
    id: 372,
    spa: 'SE_ForageSkill',
    effectName: 'Grant Foraging',
    description: 'Grants forage skill.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 373,
    spa: 'SE_CastOnFadeEffectAlways',
    effectName: 'Cast Spell On Fade (v373)',
    description:
      'Cast a spell only if buff containing this effect fades after the full duration.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 374,
    spa: 'SE_ApplyEffect',
    effectName: 'Spell Trigger: Apply Each Spell',
    description:
      'Chance to cast a spell on the target. When multiple of this effect are present, each is applied.',
    base: 'percent chance',
    limit: 'spellid',
    max: 'none',
    notes: '',
  },
  {
    id: 375,
    spa: 'SE_DotCritDmgIncrease',
    effectName: 'Critical DoT Damage',
    description: 'Modify damage from critical damage over time by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 376,
    spa: 'SE_Fling',
    effectName: 'Fling',
    description: 'Knocbkack to target. Handled client side.',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 377,
    spa: 'SE_CastOnFadeEffectNPC',
    effectName: 'Cast Spell On Fade (v377)',
    description:
      'Cast a spell only if buff containing this effect fades after the full duration.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 378,
    spa: 'SE_SpellEffectResistChance',
    effectName: 'Spell Effect Resist Chance',
    description: 'Chance to resist specific spell effect.',
    base: 'chance modifier',
    limit: 'spell effect id',
    max: 'none',
    notes: '',
  },
  {
    id: 379,
    spa: 'SE_ShadowStepDirectional',
    effectName: 'Directional Shadowstep',
    description: 'Teleport a specified distance and direction.',
    base: 'distance unit',
    limit: 'direction degrees',
    max: '',
    notes:
      'This effect is handled client side. Unclear how base value equates to actual in game distance movement. Limit directional values example, 0: Shadowstep Forward, 90: Shadowstep Right, 180:Shadowstep Back, 270: Shadowstep Left',
  },
  {
    id: 380,
    spa: 'SE_Knockdown',
    effectName: 'Knockback',
    description: 'Knockback effect.',
    base: 'push up?',
    limit: 'push back?',
    max: 'none',
    notes: 'Handled by client.',
  },
  {
    id: 381,
    spa: 'SE_KnockTowardCaster',
    effectName: 'Fling Target to Caster',
    description: 'Knockback to caster. Handled client side.',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 382,
    spa: 'SE_NegateSpellEffect',
    effectName: 'Negate Spell Effect',
    description:
      'Negates specific spell effect benefits for the duration of the debuff and prevent non-duration spell effect from working.',
    base: 'negate spell effect type',
    limit: 'spell effect id',
    max: 'none',
    notes: '',
  },
  {
    id: 383,
    spa: 'SE_SympatheticProc',
    effectName: 'Focus: Proc on Spell Cast',
    description: 'Cast on spell use with proc rate determined by cast time.',
    base: 'proc rate modifier',
    limit: 'spellid',
    max: 'none',
    notes:
      'Typically found on item focus effects. Longer cast time spells are adjusted to have higher proc rates.',
  },
  {
    id: 384,
    spa: 'SE_Leap',
    effectName: 'Fling Caster to Target',
    description: 'Teleport to location that is a specificed distance away.',
    base: 'distance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 385,
    spa: 'SE_LimitSpellGroup',
    effectName: 'Limit: SpellGroup',
    description:
      'Spell group(s) that a spell focus can require or exclude, base1: spellgroup id, Include: Positive Exclude: Negative',
    base: 'spellgroup id',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
  },
  {
    id: 386,
    spa: 'SE_CastOnCurer',
    effectName: 'Trigger Spell on Curer',
    description: 'Casts a spell on the curer of the afflicition.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: 'This effect goes on the spell that needs curing.',
  },
  {
    id: 387,
    spa: 'SE_CastOnCure',
    effectName: 'Trigger Spell on Cure',
    description: 'Casts a spell on the entity being cured of the afflicition.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: 'This effect goes on the spell that needs curing.',
  },
  {
    id: 388,
    spa: 'SE_SummonCorpseZone',
    effectName: 'Summon All Corpses',
    description:
      "Summons all of the corpses of your targeted group member to that target's location.",
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 389,
    spa: 'SE_FcTimerRefresh',
    effectName: 'Focus: Spell Gem Refresh',
    description:
      'Reset all recast spell gem timers, can limit to reset only specific spell gem timers.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes: 'Applied from casted spells only.',
  },
  {
    id: 390,
    spa: 'SE_FcTimerLockout',
    effectName: 'Focus: Spell Gem Lockout',
    description: 'Set a spell gem to be on recast timer.',
    base: 'recast duration milliseconds',
    limit: 'none',
    max: 'none',
    notes: 'Applied from casted spells only.',
  },
  {
    id: 391,
    spa: 'SE_LimitManaMax',
    effectName: 'Limit: Max Mana',
    description: 'Mininum mana of spell that can be focused',
    base: 'mana amount',
    limit: 'none',
    max: 'none',
    notes: '',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: `Limit: Max Mana (${getBaseValue(spell, effectIndex)})`,
      };
    },
  },
  {
    id: 392,
    spa: 'SE_FcHealAmt',
    effectName: 'Focus: Healing Amount (v392)',
    description: 'Modify healing by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 393,
    spa: 'SE_FcHealPctIncoming',
    effectName: 'Focus: Incoming Healing Effectiveness (v392)',
    description: 'Modify incoming heals by a percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 394,
    spa: 'SE_FcHealAmtIncoming',
    effectName: 'Focus: Incoming Healing Amount',
    description: 'Modify incoming heals by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 395,
    spa: 'SE_FcHealPctCritIncoming',
    effectName: 'Focus: Incoming Healing Effectiveness (v395)',
    description: 'Modify incoming heals by a percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 396,
    spa: 'SE_FcHealAmtCrit',
    effectName: 'Focus: Healing Amount (v396 before crit)',
    description:
      'Modify incoming heals by a flat amount. Healing is added before critical calculation.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 397,
    spa: 'SE_PetMeleeMitigation',
    effectName: 'Pet Mitigation',
    description: 'Modify pets incoming damage mitigation by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 398,
    spa: 'SE_SwarmPetDuration',
    effectName: 'Focus: Swarm Pet Duration',
    description: 'Increase swarm pet duration by amount time.',
    base: 'duration ms',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 399,
    spa: 'SE_FcTwincast',
    effectName: 'Focus: Twincast Chance',
    description: 'Chance to cast a spell a second time.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 400,
    spa: 'SE_HealGroupFromMana',
    effectName: 'Heal Group From Mana',
    description:
      'Drains your mana and heals your target for an amount determined by ratio modifier for each point of mana drained.',
    base: 'max amount mana drained',
    limit: 'ratio of HP gain per 1 mana drained',
    max: 'none',
    notes:
      'Ratio is calculated as value / 10, example if you want to heal 13 HP for every 1 mana, set base to 130.',
  },
  {
    id: 401,
    spa: 'SE_ManaDrainWithDmg',
    effectName: 'Damage for Amount Mana Drained',
    description:
      'Drains your mana and damages a target for an amount determined by ratio modifier for each point of mana drained.',
    base: 'max amount mana drained',
    limit: 'ratio of HP of damage per 1 mana drained',
    max: '',
    notes:
      'Ratio is calculated as value / 10, example if you want to damage for l 13 HP for every 1 mana, set base to 130.',
  },
  {
    id: 402,
    spa: 'SE_EndDrainWithDmg',
    effectName: 'Damage for Amount Endurance Drained',
    description:
      'Drains your mana and damages a target for an amount determined by ratio modifier for each point of mana drained.',
    base: 'max amount endurance drained',
    limit: 'ratio of HP of damage per 1 endurance drained',
    max: '',
    notes:
      'Ratio is calculated as value / 10, example if you want to damage for l 13 HP for every 1 endurance, set base to 130.',
  },
  {
    id: 403,
    spa: 'SE_LimitSpellClass',
    effectName: 'Limit: SpellClass',
    description:
      "Spell Category' using table field 'spell_class' that a spell focus can require or exclude.",
    base: 'spell_class id',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
  },
  {
    id: 404,
    spa: 'SE_LimitSpellSubclass',
    effectName: 'Limit: SpellSubclass',
    description:
      "Spell Category Subclass' using table field 'spell_subclass' that a spell focus can require or exclude.",
    base: 'spell_subclass id',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
  },
  {
    id: 405,
    spa: 'SE_TwoHandBluntBlock',
    effectName: 'Staff Block Chance',
    description:
      'Chance to block an attack while two handed blunt weapon is equiped.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 406,
    spa: 'SE_CastonNumHitFade',
    effectName: 'Trigger Spell on Hit Count Fade',
    description: 'Cast a spell when a spell buffs hit counter is depleted.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 407,
    spa: 'SE_CastonFocusEffect',
    effectName: 'Trigger Spell on Focus Effect Success',
    description: 'Casts a spell if the spells focus limits are met.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes: 'This effect goes on a spell with a focus effect.',
  },
  {
    id: 408,
    spa: 'SE_LimitHPPercent',
    effectName: 'Heal Up To Percent Limit',
    description:
      'Cap HP at lowest of percent or amount. Can not be healed beyond this limit.',
    base: 'percent HP',
    limit: 'amount HP',
    max: 'none',
    notes: '',
  },
  {
    id: 409,
    spa: 'SE_LimitManaPercent',
    effectName: 'Restore Mana Up To Percent Limit',
    description:
      'Cap Mana at lowest of percent or amount. Can have mana restored beyond this limit.',
    base: 'percent HP',
    limit: 'amount HP',
    max: 'none',
    notes: '',
  },
  {
    id: 410,
    spa: 'SE_LimitEndPercent',
    effectName: 'Restore Endurance Up To Percent Limit',
    description:
      'Cap HP at lowest of percent or amount. Can not be healed beyond this limit.',
    base: 'percent HP',
    limit: 'amount HP',
    max: 'none',
    notes: '',
  },
  {
    id: 411,
    spa: 'SE_LimitClass',
    effectName: 'Limit: PlayerClass',
    description: 'Class(es) that can use the spell focus.',
    base: 'class bitmask',
    limit: 'none',
    max: 'none',
    notes:
      'The class value in dbase is +1 in relation to item class value, set as you would item for multiple classes.',
  },
  {
    id: 412,
    spa: 'SE_LimitRace',
    effectName: 'Limit: Race',
    description: 'Race that can use the spell focus.',
    base: 'race id',
    limit: 'none',
    max: 'none',
    notes: 'Not used in any known live spells. Use only single race at a time.',
  },
  {
    id: 413,
    spa: 'SE_FcBaseEffects',
    effectName: 'Focus: Base Spell Value',
    description:
      'Modify spell effect value after formula calculations but before other focuses.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Used to set bard instrument modifiers. Can be used to focus many effects otherwise not able to be focused by other methods. If modifying spells that are buffs, value must be intervals of 10% and starting at greater than 10%. For example, if a 10% increase in rune amount is required, set base value to 11, that will be calculated as base value * 1.10, resulting in a 10% increase. For a 20% increase set to 12.',
  },
  {
    id: 414,
    spa: 'SE_LimitCastingSkill',
    effectName: 'Limit: CastingSkill',
    description:
      'Spell and singing skills(s) that a spell focus can require or exclude.',
    base: 'skill type',
    limit: 'none',
    max: 'none',
    notes: 'Include set value to positive',
  },
  {
    id: 415,
    spa: 'SE_FFItemClass',
    effectName: 'Limit: ItemClass',
    description: 'Limits focuses to be applied only from item click.',
    base: 'item ItemType',
    limit: 'item SubType',
    max: 'item Slots',
    notes:
      'Not used on live. Details, base: item ItemType (-1 to include for all ItemTypes, -1000 to exclude clicks from getting the focus, or exclude specific SubTypes or Slots if set), limit: item SubType (-1 for all SubTypes), max: item Slots (bitmask of valid slots, -1 ALL slots), See comments in Mob::CalcFocusEffect for more details. Special: Can be used with SPA 310 reduce item click recast and SPA 127, 500,5001 to reduce item click casting time.',
  },
  {
    id: 416,
    spa: 'SE_ACv2',
    effectName: 'AC (v416)',
    description: 'Modify AC by amount',
    base: 'amount',
    limit: 'none',
    max: 'amount',
    notes: '',
  },
  {
    id: 417,
    spa: 'SE_ManaRegen_v2',
    effectName: 'Mana Regen (v417)',
    description: 'Modify mana by amount, repeates every tic if in a buff.',
    base: 'amount',
    limit: 'none',
    max: 'max amount (use positive value)',
    notes: '',
  },
  {
    id: 418,
    spa: 'SE_SkillDamageAmount2',
    effectName: 'Skill Damage Bonus (v418)',
    description:
      'Add a flat amount of damage when a specific melee skill is used.',
    base: 'amount',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 419,
    spa: 'SE_AddMeleeProc',
    effectName: 'Add Melee Proc (v419)',
    description: 'Add proc to melee.',
    base: 'spellid',
    limit: 'rate modifer',
    max: 'none',
    notes: '',
  },
  {
    id: 420,
    spa: 'SE_FcLimitUse',
    effectName: 'Focus: Hit Count',
    description: 'Modify buff hit count by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      "Not used in any known live spells. Hit count is set using field 'numhits' in spells new.",
  },
  {
    id: 421,
    spa: 'SE_FcIncreaseNumHits',
    effectName: 'Focus: Hit Count Amount',
    description: 'Modify buff hit count by flat amount.',
    base: 'hit count amount',
    limit: 'none',
    max: 'none',
    notes: "Hit count is set using field 'numhits' in spells new.",
  },
  {
    id: 422,
    spa: 'SE_LimitUseMin',
    effectName: 'Limit: Minimum Hit Count',
    description: 'Minium amount of hit count for a spell to be focused.',
    base: 'hit count amount',
    limit: 'nonw',
    max: 'none',
    notes: "Hit count is set using field 'numhits' in spells new.",
  },
  {
    id: 423,
    spa: 'SE_LimitUseType',
    effectName: 'Limit: Hit Count Type',
    description: 'Focus will only affect if has this hit count type.',
    base: 'hit count type',
    limit: 'nonw',
    max: 'none',
    notes:
      "hit type is set using field 'numhitstype' in spells_new. 1:Incoming Hit Attempts, 2:Outgoing Hit Attempts, 3:Incoming Spells, 4:Outgoing Spells, 5: Outgoing Hit Successes, 6:Incoming Hit Successes, 7:Matching Spells, 8:Incoming Hits Or Spells, 9:Reflected Spells, 10:Defensive Proc Casts, 11: Offensive Proc Casts.",
  },
  {
    id: 424,
    spa: 'SE_GravityEffect',
    effectName: 'Gravitate',
    description:
      'Causes a target that is within specific distance of you to gravitate toward or away from you with set amount of force over a period of time.',
    base: 'Force',
    limit: 'Distance',
    max: 'unknown',
    notes: 'Negative base value will pull target',
  },
  {
    id: 425,
    spa: 'SE_Display',
    effectName: 'Fly',
    description: 'Grants flying animation to certain illusions.',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 426,
    spa: 'SE_IncreaseExtTargetWindow',
    effectName: 'AddExtTargetSlots',
    description: 'Increases the capacity of your extended target window',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 427,
    spa: 'SE_SkillProc',
    effectName: 'Skill Proc On Attempt',
    description: 'Add proc to a specific combat or ability skill is used.',
    base: 'spellid',
    limit: 'rate modifer',
    max: 'none',
    notes:
      'Example, can add a proc to taunt which will have a chance to fire each time you use skill.',
  },
  {
    id: 428,
    spa: 'SE_LimitToSkill',
    effectName: 'Limit To Skill',
    description:
      'Limits what combat skills will trigger a skill (SPA 426, 429), melee (SPA 419) or ranged (SPA 201) proc.',
    base: 'skill type',
    limit: 'none',
    max: 'none',
    notes:
      'This needs to be placed after the proc SPA in a spell to be checked properly.',
  },
  {
    id: 429,
    spa: 'SE_SkillProcSuccess',
    effectName: 'Skill Proc On Success',
    description:
      'Add proc to a specific combat or ability skill when that skill is succesfully used.',
    base: 'spellid',
    limit: 'rate modifer',
    max: 'none',
    notes:
      'Example, can add a proc to taunt which will have a chance to fire if you taunt successsfully.',
  },
  {
    id: 430,
    spa: 'SE_PostEffect',
    effectName: 'PostEffect',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 431,
    spa: 'SE_PostEffectData',
    effectName: 'PostEffectData',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 432,
    spa: 'SE_ExpandMaxActiveTrophyBen',
    effectName: 'Expand Max Active Trophy Benefits',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 433,
    spa: 'SE_CriticalDotDecay',
    effectName: 'Critical DoT Decay',
    description:
      'Increase critical dot chance, effect decays based on level of spell it effects.',
    base: 'percent chance',
    limit: 'decay modifier',
    max: 'none',
    notes:
      'Live no longer uses this effect, replaced after ROF2 with different effect. Effects were introduced during VoA.',
  },
  {
    id: 434,
    spa: 'SE_CriticalHealDecay',
    effectName: 'Critical Heal Decay',
    description:
      'Increase critical heal chance, effect decays based on level of spell it effects.',
    base: 'percent chance',
    limit: 'decay modifier',
    max: 'none',
    notes:
      'Live no longer uses this effect, replaced after ROF2 with different effect. Effects were introduced during VoA.',
  },
  {
    id: 435,
    spa: 'SE_CriticalRegenDecay',
    effectName: 'Critic Heal Over Time Decay',
    description:
      'Increase critical heal over time chance, effect decays based on level of spell it effects.',
    base: 'percent chance',
    limit: 'decay modifier',
    max: 'none',
    notes:
      'Live no longer uses this effect, replaced after ROF2 with different effect. Effects were introduced during VoA.',
  },
  {
    id: 436,
    spa: 'SE_BeneficialCountDownHold',
    effectName: 'Toggle Freeze Buff Timers',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 437,
    spa: 'SE_TeleporttoAnchor',
    effectName: 'Teleport to Anchor',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 438,
    spa: 'SE_TranslocatetoAnchor',
    effectName: 'Translocate to Anchor',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 439,
    spa: 'SE_Assassinate',
    effectName: 'Assassinate',
    description:
      'Grants backstab and critical throwing attacks a chance to deal massive damage to targets when attacking from behind.',
    base: 'percent chance',
    limit: 'damage amount',
    max: 'none',
    notes: 'Use with SPA 345 to set max target level and bonus chance.',
  },
  {
    id: 440,
    spa: 'SE_FinishingBlowLvl',
    effectName: 'Finishing Blow Max Level',
    description:
      'Sets the max level and max hit point ratio an NPC must be to receive a Finishing Blow.',
    base: 'max target level',
    limit: 'hit point percent to trigger',
    max: 'none',
    notes:
      'Limit value is calculated as limit / 10. To set FB to trigger below 10 pct HP, set limit to 100. If multiple version of this affect exist it will use highest HP percent.',
  },
  {
    id: 441,
    spa: 'SE_DistanceRemoval',
    effectName: 'Distance Buff Removal',
    description:
      'Buff is removed from target when target moves specified amount of distance away from where initially hit.',
    base: 'distance amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 442,
    spa: 'SE_TriggerOnReqTarget',
    effectName: 'Trigger Spell on Target Requirement',
    description: 'Cast a spell when Target Requirement conditions are met.',
    base: 'spellid',
    limit: 'Target Restriction ID',
    max: 'none',
    notes:
      'See enum SpellRestriction in spdat.h for IDs. This trigger spell is usually cast on a target.',
  },
  {
    id: 443,
    spa: 'SE_TriggerOnReqCaster',
    effectName: 'Trigger Spell on Caster Requirement',
    description: 'Cast a spell when Caster Requirement conditions are met',
    base: 'spellid',
    limit: 'Target Restriction ID',
    max: 'none',
    notes:
      'See enum SpellRestriction in spdat.h for IDs. This trigger spell is usually cast on self.',
  },
  {
    id: 444,
    spa: 'SE_ImprovedTaunt',
    effectName: 'Improved Taunt',
    description:
      'Causes target to locks aggro on the caster and decreases other players hate by percentage on NPC targets below the specified max level.',
    base: 999,
    limit: 'other players percent of hate generation',
    max: 'max target level',
    notes:
      'Limit greater than 100 increased hate generation on other players (120 = 20 pct increased hate generation)',
  },
  {
    id: 445,
    spa: 'SE_AddMercSlot',
    effectName: 'Add Merc Slot',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 446,
    spa: 'SE_AStacker',
    effectName: 'A Stacker',
    description: 'Buff blocker A',
    base: 'stacking value',
    limit: 'none',
    max: 'none',
    notes:
      'Buffs containing these effects can block each other from taking hold via the following. Does not matter what slot the effect is in. (B) Blocks any buffs from taking hold with (A) in it. (C) Blocks any buff from taking hold with (B) in it.',
  },
  {
    id: 447,
    spa: 'SE_BStacker',
    effectName: 'B Stacker',
    description: 'Buff blocker B',
    base: 'stacking value',
    limit: 'none',
    max: 'none',
    notes:
      'Buffs containing these effects can block each other from taking hold via the following. Does not matter what slot the effect is in. (B) Blocks any buffs from taking hold with (A) in it. (C) Blocks any buff from taking hold with (B) in it.',
  },
  {
    id: 448,
    spa: 'SE_CStacker',
    effectName: 'C Stacker',
    description: 'Buff blocker C',
    base: 'stacking value',
    limit: 'none',
    max: 'none',
    notes:
      'Buffs containing these effects can block each other from taking hold via the following. Does not matter what slot the effect is in. (B) Blocks any buffs from taking hold with (A) in it. (C) Blocks any buff from taking hold with (B) in it.',
  },
  {
    id: 449,
    spa: 'SE_DStacker',
    effectName: 'D Stacker',
    description: 'Buff blocker D',
    base: 'stacking value',
    limit: 'none',
    max: 'none',
    notes:
      'Buffs containing these effects can block each other from taking hold via the following. Does not matter what slot the effect is in. (B) Blocks any buffs from taking hold with (A) in it. (C) Blocks any buff from taking hold with (B) in it.',
  },
  {
    id: 450,
    spa: 'SE_MitigateDotDamage',
    effectName: 'Mitigate Damage Over Time Rune',
    description:
      'Mitigate incoming damage from damage over time spells by percentage until rune fades.',
    base: 'percent mitigation',
    limit: 'max damage absorbed per hit',
    max: 'rune amount',
    notes:
      'Special: If this effect is placed on item as worn effect or as an AA, it will provide stackable percent damage over time mitigation for the base value.',
  },
  {
    id: 451,
    spa: 'SE_MeleeThresholdGuard',
    effectName: 'Melee Threshold Guard',
    description:
      'Partial Melee Rune that only is lowered if melee hits are over the specified amount of damage.',
    base: 'percent mitigation',
    limit: 'minimum damage to be lowered',
    max: 'rune amount',
    notes: '',
  },
  {
    id: 452,
    spa: 'SE_SpellThresholdGuard',
    effectName: 'Spell Threshold Guard',
    description:
      'Partial Spell Rune that only is lowered if spell hits are over the specified amount of damage.',
    base: 'percent mitigation',
    limit: 'minimum damage to be lowered',
    max: 'rune amount',
    notes: '',
  },
  {
    id: 453,
    spa: 'SE_TriggerMeleeThreshold',
    effectName: 'Trigger Spell on Melee Threshold',
    description:
      'Cast a spell when a specified amount of melee damage taken in a single hit.',
    base: 'spellid',
    limit: 'amount of melee damage',
    max: 'none',
    notes: '',
  },
  {
    id: 454,
    spa: 'SE_TriggerSpellThreshold',
    effectName: 'Trigger Spell on Spell Threshold',
    description:
      'Cast a spell when a specified amount of spell damage is taken in a single hit.',
    base: 'spellid',
    limit: 'amount of spell damage',
    max: 'none',
    notes: '',
  },
  {
    id: 455,
    spa: 'SE_AddHatePct',
    effectName: 'Add Hate Percent',
    description: 'Modify targets total hate toward the caster by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: 'Positive value increased hate.',
  },
  {
    id: 456,
    spa: 'SE_AddHateOverTimePct',
    effectName: 'Add Hate Over Time Percent',
    description:
      'Modify targets total hate toward the caster by percentage, repeates every tic if in a buff.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: 'Positive value increases hate.',
  },
  {
    id: 457,
    spa: 'SE_ResourceTap',
    effectName: 'Resource Tap',
    description:
      'Return a percentage of Spell Damage as (HP/Mana/Endurance), up to a maximum amount per spell.',
    base: 'percent coverted',
    limit: '0=HP, 1=Mana,2=Endurance',
    max: 'max amount resource returned',
    notes:
      'Conversion percent calculated as value / 10, example to convert 85 percent of damage to mana set base value to 850 and limit to 1.',
  },
  {
    id: 458,
    spa: 'SE_FactionModPct',
    effectName: 'Faction Pct',
    description: 'Modify faction gains and losses by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 459,
    spa: 'SE_DamageModifier2',
    effectName: 'Skill Damage Modifier (v459)',
    description: 'Modify melee damage by skill.',
    base: 'percent modifer',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 460,
    spa: 'SE_Ff_Override_NotFocusable',
    effectName: 'Limit: Include Non-Focusable',
    description:
      "Allow spell to be focused even if flagged with 'not_focusable' in spell table.",
    base: 1,
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 461,
    spa: 'SE_ImprovedDamage2',
    effectName: 'Focus: Spell Damage (v461)',
    description: 'Modify outgoing spell damage by percentage.',
    base: 'min percent',
    limit: 'none',
    max: 'max percent',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Damage',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 462,
    spa: 'SE_FcDamageAmt2',
    effectName: 'Focus: Spell Damage Amount (v462)',
    description: 'Modify outgoing spell damage by a flat amount',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 463,
    spa: 'SE_Shield_Target',
    effectName: 'Shield Target',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 464,
    spa: 'SE_PC_Pet_Rampage',
    effectName: 'PC Pet Rampage',
    description:
      'Percent chance for a pet to do a rampage melee attack with damage modifier each melee round.',
    base: 'percent chance',
    limit: 'damage modifier',
    max: 'none',
    notes:
      'Limit greater than 100 for increased damage (120 = 20 pct increased damage)',
  },
  {
    id: 465,
    spa: 'SE_PC_Pet_AE_Rampage',
    effectName: 'PC Pet AE Rampage',
    description:
      'Percent chance for a pet to do a AE rampage melee attack with damage modifier each melee round.',
    base: 'percent chance',
    limit: 'damage modifier',
    max: 'none',
    notes:
      'Limit greater than 100 for increased damage (120 = 20 pct increased damage)',
  },
  {
    id: 466,
    spa: 'SE_PC_Pet_Flurry_Chance',
    effectName: 'PC Pet Flurry Chance',
    description:
      'Percent chance for a pet to do flurry from double attack hit.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 467,
    spa: 'SE_DS_Mitigation_Amount',
    effectName: 'Damage Shield Mitigation Amount',
    description: 'Modify incoming damage shield damage by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 468,
    spa: 'SE_DS_Mitigation_Percentage',
    effectName: 'Damage Shield Mitigation Percentage',
    description: 'Modify incoming damage shield damage by percentage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 469,
    spa: 'SE_Chance_Best_in_Spell_Grp',
    effectName: 'Spell Trigger: Best in Spell Group: Only One Spell Cast',
    description:
      'Chance to cast highest scribed spell within a spell group. When multiple of this effects are present, only one is cast.',
    base: 'percent chance',
    limit: 'spellgroup id',
    max: '',
    notes:
      'When multiple of this effect exist on the same spell, only one spell will be selected from the list to be cast. For best results, the total percent chance should equal 100%. Example, Slot 1: Cast Ice Nuke spellgroup 20%, Slot2: Cast Fire Nuke spellgroup 50%, Slot3 Cast Magic Nuke spellgroup 30%. When the spell is cast, only one of these spells be triggered on the target.',
  },
  {
    id: 470,
    spa: 'SE_Trigger_Best_in_Spell_Grp',
    effectName: 'Spell Trigger: Best in Spell Group: Apply Each',
    description:
      'Chance to cast highest scribed spell within a spell group. Each spell has own chance.',
    base: 'percent chance',
    limit: 'spellgroup id',
    max: '',
    notes: '',
  },
  {
    id: 471,
    spa: 'SE_Double_Melee_Round',
    effectName: 'Double Melee Round (PC Only)',
    description:
      'Percent chance to repeat primary weapon round with a percent damage modifier.',
    base: 'percent chance',
    limit: 'percent damage modifier',
    max: 'none',
    notes: '',
  },
  {
    id: 472,
    spa: 'SE_Buy_AA_Rank',
    effectName: 'Toggle Passive AA Rank',
    description:
      'Used in AA abilities that have Enable/Disable toggle. Spell on Disabled Rank has this effect in it.',
    base: 1,
    limit: 'none',
    max: 'none',
    notes:
      "Certain AA, like Weapon Stance line use a special toggle Hotkey to enable or disable the AA's passive abilities. This is occurs by doing the following. Each 'rank' of Weapon Stance is actually 2 actual ranks. First rank is always the Disabled version which cost X amount of AA, this is the rank that SPA 472 goes in. Second rank is the Enabled version which cost 0 AA. When you buy the first rank, you make a hotkey that on live say 'Weapon Stance Disabled', if you clik that it then BUYS the next rank of AA (cost 0) which switches the hotkey to 'Enabled Weapon Stance' and you are given the passive buff effects. If you click the Enabled hotkey, it causes you to lose an AA rank and once again be disabled. Thus, you are switching between two AA ranks. Thefore when creating an AA using this ability, you need generate both ranks. Follow the same pattern for additional ranks. See aa.cpp for further details.",
  },
  {
    id: 473,
    spa: 'SE_Double_Backstab_Front',
    effectName: 'Double Backstab From Front',
    description: 'Chance to double backstab from front.',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 474,
    spa: 'SE_Pet_Crit_Melee_Damage_Pct_Owner',
    effectName: 'Pet Crit Melee Damage',
    description: 'Modifies your pets critical melee damage.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 475,
    spa: 'SE_Trigger_Spell_Non_Item',
    effectName: 'Trigger Spell: Not Cast From Items: Apply Each',
    description:
      'Chance to cast a spell on a target if not cast by item click. Each spell has own chance.',
    base: 'chance pecent',
    limit: 'spellid',
    max: '',
    notes: '',
  },
  {
    id: 476,
    spa: 'SE_Weapon_Stance',
    effectName: 'Weapon Stance',
    description:
      'Apply a specific spell buffs automatically if depending 2Hander, Shield or Duel Wield is equiped.',
    base: 'spellid',
    limit: '0=2H, 1=Shield, 2=DW',
    max: 'none',
    notes:
      'On live this is an AA, on emu can use as item or spell buff effect. Live AA uses a toggle system to turn on and off weapons stance. which requires use of SPA 472 SE_Buy_AA_Rank within in the AA. Details can be found in aa.cpp',
  },
  {
    id: 477,
    spa: 'SE_Hatelist_To_Top_Index',
    effectName: 'Move to Top of Rampage List',
    description: 'Chance to be set to top of rampage list',
    base: 'chacne percent',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 478,
    spa: 'SE_Hatelist_To_Tail_Index',
    effectName: 'Move to Bottom of Rampage List',
    description: 'Chance to be set to bottom of rampage list',
    base: 'percent chance',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 479,
    spa: 'SE_Ff_Value_Min',
    effectName: 'Limit: Base Value Min',
    description:
      'Minimum base value of a spell effect within a spell attempting to be focused.',
    base: 'effect_base_value',
    limit: 'spell effect id',
    max: 'none',
    notes:
      'Example, only allow focus if spell has Effect ID 0 which is a Heal and the heals effect value is less than 5000.',
  },
  {
    id: 480,
    spa: 'SE_Ff_Value_Max',
    effectName: 'Limit: Base Value Max',
    description:
      'Maximum base value of a spell effect within a spell attempting to be focused.',
    base: 'effect_base_value',
    limit: 'spell effect id',
    max: 'none',
    notes:
      'Example, only allow focus if spell has Effect ID 0 which is a Heal and the heals effect value is greater than 5000.',
  },
  {
    id: 481,
    spa: 'SE_Fc_Cast_Spell_On_Land',
    effectName: 'Focus: Trigger Spell on Spell Landing',
    description:
      'Cast spell if hit by an incoming spell and that incoming spell meets limit requirements.',
    base: 'spellid',
    limit: 'none',
    max: 'none',
    notes:
      'Example, everytime you are hit with a fire nuke, cast a heal on yourself.',
  },
  {
    id: 482,
    spa: 'SE_Skill_Base_Damage_Mod',
    effectName: 'Base Hit Damage',
    description: 'Modify base melee damage by percent.',
    base: 'percent modifier',
    limit: 'skill type (-1 = ALL skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 483,
    spa: 'SE_Fc_Spell_Damage_Pct_IncomingPC',
    effectName: 'Focus: Incoming Spell Damage (v483)',
    description: 'Modify incoming spell damage taken by percent.',
    base: 'min percent modifier',
    limit: 'none',
    max: 'max percent modifier',
    notes:
      'Use random effectiveness if base and max value are defined, where base is always lower end and max the higher end of the random range. If random value not wanted, then only set a base value.',
    buildEffectDescription: (
      spell: SpellNew,
      effectIndex: number,
      itemEffectLevel?: number,
    ) => {
      return {
        text: buildEffectTextPercent(
          'Spell Damage Taken',
          spell,
          effectIndex,
          itemEffectLevel,
          false,
          true,
        ),
      };
    },
  },
  {
    id: 484,
    spa: 'SE_Fc_Spell_Damage_Amt_IncomingPC',
    effectName: 'Focus: Incoming Spell Damage Amount (v484)',
    description: 'Modify incoming spell damage taken by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 485,
    spa: 'SE_Ff_CasterClass',
    effectName: 'Limit: Caster Class',
    description:
      'Caster of the spell on target with a focus effect that is checked by incoming spells must be specified class(es).',
    base: 'class bitmask',
    limit: 'none',
    max: 'none',
    notes:
      'Set multiple classes same as would for items. This is only used with focus effects that check against incoming spells.',
  },
  {
    id: 486,
    spa: 'SE_Ff_Same_Caster',
    effectName: 'Limit: Caster',
    description:
      'Caster of spell on target with a focus effect that is checked by incoming spells.',
    base: '0=Must be different caster 1=Must be same caster',
    limit: 'none',
    max: 'none',
    notes:
      'This is only used with focus effects that check against incoming spells.',
  },
  {
    id: 487,
    spa: 'SE_Extend_Tradeskill_Cap',
    effectName: 'Extend Tradeskill Cap',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 488,
    spa: 'SE_Defender_Melee_Force_Pct_PC',
    effectName: 'Push Taken',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 489,
    spa: 'SE_Worn_Endurance_Regen_Cap',
    effectName: 'Worn Endurance Regen Cap',
    description: 'Modify endurance regen cap from items.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 490,
    spa: 'SE_Ff_ReuseTimeMin',
    effectName: 'Limit: Reuse Time Min',
    description: 'Minimum recast time of a spell that can be focused.',
    base: 'recast time',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 491,
    spa: 'SE_Ff_ReuseTimeMax',
    effectName: 'Limit: Reuse Time Max',
    description: 'Maximum recast time of a spell that can be focused.',
    base: 'recast time',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 492,
    spa: 'SE_Ff_Endurance_Min',
    effectName: 'Limit: Endurance Min',
    description: 'Minimum endurance cost of a spell that can be focused',
    base: 'endurance cost',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 493,
    spa: 'SE_Ff_Endurance_Max',
    effectName: 'Limit: Endurance Max',
    description: 'Maximum endurance cost of a spell that can be focused.',
    base: 'endurance cost',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 494,
    spa: 'SE_Pet_Add_Atk',
    effectName: 'Pet Add ATK',
    description: 'Modifies your pets ATK by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes:
      'This effect goes on the pet owner and then the benefit is applied to the pet.',
  },
  {
    id: 495,
    spa: 'SE_Ff_DurationMax',
    effectName: 'Limit: Duration Max',
    description: 'Maximum duration of spell that can be focused.',
    base: 'tics',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 496,
    spa: 'SE_Critical_Melee_Damage_Mod_Max',
    effectName: 'Critical Melee Damage: No Stack',
    description: 'Modifies damage done from a critical melee hit by percent.',
    base: 'percent modifier',
    limit: 'skill type (-1 = all skill types)',
    max: 'none',
    notes: '',
  },
  {
    id: 497,
    spa: 'SE_Ff_FocusCastProcNoBypass',
    effectName: 'Limit: Proc No Bypass',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 498,
    spa: 'SE_AddExtraAttackPct_1h_Primary',
    effectName: 'Add Extra Attack: 1H Primary',
    description:
      'Gives your double attacks a percent chance to perform an extra attack with 1-handed primary weapon.',
    base: 'percent chance',
    limit: 'number of attacks',
    max: 'none',
    notes: '',
  },
  {
    id: 499,
    spa: 'SE_AddExtraAttackPct_1h_Secondary',
    effectName: 'Add Extra Attack: 1H Secondary',
    description:
      'Gives your double attacks a percent chance to perform an extra attack with 1-handed secondary weapon.',
    base: 'percent chance',
    limit: 'number of attacks',
    max: 'none',
    notes: '',
  },
  {
    id: 500,
    spa: 'SE_Fc_CastTimeMod2',
    effectName: 'Focus: Spell Haste (v500, no cap)',
    description: 'Modify cast time by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: 'Can reduce cast time to 0.',
  },
  {
    id: 501,
    spa: 'SE_Fc_CastTimeAmt',
    effectName: 'Focus: Spell Cast Time',
    description: 'Modify cast time by flat amount.',
    base: 'time ms',
    limit: 'none',
    max: 'none',
    notes: 'Can reduce cast time to 0.',
  },
  {
    id: 502,
    spa: 'SE_Fearstun',
    effectName: 'Fearstun',
    description:
      'Stun with a max level limit. Fear restrictions apply. Normal stun restrictions do not apply.',
    base: 'duration ms',
    limit: 'PC duration ms',
    max: 'target max level',
    notes:
      'Max value can be calculated in two ways, to set a max level that target can be affected the formula is value - 1000, example if max level is 80, then set as 1080. If you want to set max level to be relative to caster, example only affects entities that are 3 more less level higher than caster, then set max value to 3.',
  },
  {
    id: 503,
    spa: 'SE_Melee_Damage_Position_Mod',
    effectName: 'Rear Arc Melee Damage Mod',
    description:
      'Modify melee damage by percent if done from Front or Behind opponent.',
    base: 'percent modifier',
    limit: '0=back, 1=front',
    max: '',
    notes: '',
  },
  {
    id: 504,
    spa: 'SE_Melee_Damage_Position_Amt',
    effectName: 'Rear Arc Melee Damage Amt',
    description:
      'Modify melee damage by flat amount if done from Front or Behind opponen.',
    base: 'amount',
    limit: '0=back, 1=front',
    max: '',
    notes: '',
  },
  {
    id: 505,
    spa: 'SE_Damage_Taken_Position_Mod',
    effectName: 'Rear Arc Damage Taken Mod',
    description:
      'Modify incoming melee damage by percent if damageis taken from Front or Behind.',
    base: 'percent modifier',
    limit: '0=back, 1=front',
    max: '',
    notes: '',
  },
  {
    id: 506,
    spa: 'SE_Damage_Taken_Position_Amt',
    effectName: 'Rear Arc Damage Taken Amt',
    description:
      'Modify incoming melee damage by flat amount if damage is taken from your Front or Behind.',
    base: 'amount',
    limit: '0=back, 1=front',
    max: '',
    notes: '',
  },
  {
    id: 507,
    spa: 'SE_Fc_Amplify_Mod',
    effectName: 'Focus: Spell Heal Damage and DoT',
    description: 'Modify spell damage, healing and damge over time by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 508,
    spa: 'SE_Fc_Amplify_Amt',
    effectName: 'Focus: Spell Heal Damage and DoT Amount',
    description:
      'Modify spell damage, healing and damge over time by a flat amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes: '',
  },
  {
    id: 509,
    spa: 'SE_Health_Transfer',
    effectName: 'Health Transfer',
    description: 'Exchange health for damage or healing on a target.',
    base: 'casters percent HP change',
    limit: 'percent of casters HP to damage',
    max: 'none',
    notes:
      'Used in newer versions of Lifeburn and Act of Valor. Base is calculated as value / 100, where a reducation of 75 percent of casters HP would be value 750. Limit is calculated as value / 10, if value is set to 1000 then damage will be 100 percent of casters HP. Negative base decreases casters HP, negative limit decreases targets HP, positive limit heals target.',
  },
  {
    id: 510,
    spa: 'SE_Fc_ResistIncoming',
    effectName: 'Focus: Incoming Resist Modifier',
    description: 'Modify incoming spells resist modifier by amount.',
    base: 'amount',
    limit: 'none',
    max: 'none',
    notes:
      'Positive value will lower resist modifier. Every 2 pts of value equals a resist rate decrease of 1 percent. Example, base -750 and limit -10000, will consumes 75% of your current health and deals 1000% of that health as direct damage.',
  },
  {
    id: 511,
    spa: 'SE_Ff_FocusTimerMin',
    effectName: 'Limit: Focus Reuse Timer',
    description: 'Sets a recast time until focus can be used again.',
    base: 1,
    limit: 'time ms',
    max: 'none',
    notes:
      'Example, set limit to 1500, then this focus can only trigger once every 1.5 seconds.',
  },
  {
    id: 512,
    spa: 'SE_Proc_Timer_Modifier',
    effectName: 'Proc Reuse Timer',
    description: 'Sets a recast time until a proc can fire again.',
    base: 1,
    limit: 'time ms',
    max: 'none',
    notes:
      'Example, set limit to 1500, then this proc can only trigger once every 1.5 seconds.',
  },
  {
    id: 513,
    spa: 'SE_Mana_Max_Percent',
    effectName: 'Mana Max Percent',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 514,
    spa: 'SE_Endurance_Max_Percent',
    effectName: 'Endurance Max Percent',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 515,
    spa: 'SE_AC_Avoidance_Max_Percent',
    effectName: 'AC Avoidance Max Percent',
    description: 'Modify AC avoidance by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Calculated as base value / 100 is actual percent. Example for 7.14 percent modifier, set to 714.',
  },
  {
    id: 516,
    spa: 'SE_AC_Mitigation_Max_Percent',
    effectName: 'AC Mitigation Max Percent',
    description: 'Modify AC mitigation by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Calculated as base value / 100 is actual percent. Example for 7.14 percent modifier, set to 714.',
  },
  {
    id: 517,
    spa: 'SE_Attack_Offense_Max_Percent',
    effectName: 'Attack Offense Max Percent',
    description: 'Modify ATK offense by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Calculated as base value / 100 is actual percent. Example for 7.14 percent modifier, set to 714.',
  },
  {
    id: 518,
    spa: 'SE_Attack_Accuracy_Max_Percent',
    effectName: 'Attack Accuracy Max Percent',
    description: 'Modify ATK accuracy by percent.',
    base: 'percent modifier',
    limit: 'none',
    max: 'none',
    notes:
      'Calculated as base value / 100 is actual percent. Example for 7.14 percent modifier, set to 714.',
  },
  {
    id: 519,
    spa: 'SE_Luck_Amount',
    effectName: 'Luck Amount',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 520,
    spa: 'SE_Luck_Percent',
    effectName: 'Luck Percent',
    description: '',
    base: '',
    limit: '',
    max: '',
    notes: '',
  },
  {
    id: 521,
    spa: 'SE_Endurance_Absorb_Pct_Damage',
    effectName: 'Absorb Damage with Endurance',
    description:
      'Reduces a percent of incoming damage using endurance, drains endurance at a ratio.',
    base: 'mitigation percentage',
    limit: 'ratio',
    max: 'none',
    notes:
      'Base calculated as value / 100, example if base 2000 then mitigation is 20 percent. Limit is calculated as value / 10000, example if limit 500 then ratio will be 0.05 Endurance reduced per 1 Hit Point of damage.',
  },
  {
    id: 522,
    spa: 'SE_Instant_Mana_Pct',
    effectName: 'Instant Mana Percent',
    description:
      'Modify mana by percent of maximum mana, or flat amount, whichever is lower.',
    base: 'percent of max mana',
    limit: 'max amount',
    max: 'none',
    notes: 'Negative base value increases mana',
  },
  {
    id: 523,
    spa: 'SE_Instant_Endurance_Pct',
    effectName: 'Instant Endurance Percent',
    description:
      'Modify endurance by percent of maximum endurance, or flat amount, whichever is lower.',
    base: 'percent of max endurance',
    limit: 'max amount',
    max: 'none',
    notes: 'Negative base value increases endurance',
  },
  {
    id: 524,
    spa: 'SE_Duration_HP_Pct',
    effectName: 'Duration HP Percent',
    description:
      'Modify hit points by percent of maximum hit points, or flat amount, whichever is lower, repeates every tic if in a buff.',
    base: 'percent of max hit points',
    limit: 'max amount',
    max: 'none',
    notes: 'Negative base value increases hit points',
  },
  {
    id: 525,
    spa: 'SE_Duration_Mana_Pct',
    effectName: 'Duration Mana Percent',
    description:
      'Modify mana by percent of maximum mana, or flat amount, whichever is lower, repeates every tic if in a buff.',
    base: 'percent of max mana',
    limit: 'max amount',
    max: 'none',
    notes: 'Negative base value increases mana',
  },
  {
    id: 526,
    spa: 'SE_Duration_Endurance_Pct',
    effectName: 'Duration Endurance Percent',
    description:
      'Modify endurance by percent of maximum endurance, or flat amount, whichever is lower, repeates every tic if in a buff.',
    base: 'percent of max endurance',
    limit: 'max amount',
    max: 'none',
    notes: 'Negative base value increases endurance',
  },
];

export const spellEffectMap = new Map<number, SpellEffect>(
  spellEffects.map((effect) => [effect.id, effect]),
);
