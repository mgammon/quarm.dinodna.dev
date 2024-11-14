import { Classes, classIds } from '../../api/classes';
import { PlayableRaces } from '../../api/race';
import { Item } from '../../items/item.entity';
import {
  clientGetAvoidance,
  getMitigation,
  getToHitByHand,
  mobGetOffenseByHand,
} from './quarm.attack';
import { Character } from './quarm.character';

export const calcMaxHP = (character: Character, unbuffed: boolean) => {
  let val = clientCalcBaseHP(character, unbuffed) + character.itemBonuses.hp;

  //The AA desc clearly says it only applies to base hp..
  //but the actual effect sent on live causes the client
  //to apply it to (basehp + itemhp).. I will oblige to the client's whims over
  //the aa description

  // Natural Durability and Physical Enhancement
  // double nd = 0.0;
  // int nd_level = GetAA(aaNaturalDurability);
  // if (nd_level != 0)
  // {
  // 	switch (nd_level)
  // 	{
  // 		case 1: nd = 2.0; break;
  // 		case 2: nd = 5.0; break;
  // 		case 3: nd = 10.0; break;
  // 	}
  // 	// Physical Enhancement only functions if you have at least 1 point in Natural Durability
  // 	int pe_level = GetAA(aaPhysicalEnhancement);
  // 	if (pe_level != 0)
  // 	{
  // 		nd += 2.0;
  // 	}
  // }

  // // Planar Durability - WAR PAL SHD ability
  // // Note that de-leveling below 60 after getting this ability causes you to lose hitpoints
  // int pd_level = GetAA(aaPlanarDurability);
  // if (pd_level != 0)
  // {
  // 	int levels_over_60 = character.level - 60;
  // 	pd_level = pd_level > levels_over_60 ? levels_over_60 : pd_level;
  // 	if (character.classId == Classes.Warrior)
  // 	{
  // 		nd += 1.5 * pd_level;
  // 	}
  // 	else if (character.classId == Classes.Paladin || character.classId == Classes.ShadowKnight)
  // 	{
  // 		nd += 1.25 * pd_level;
  // 	}
  // }

  // the results can end up being slightly off between the server, the mac client and the windows client due to floating point precision
  // there are cases where the clients end up with different hp totals for the same character, but have only seen it off by 1 hp
  // val += (int32)(val * nd / 100.0);
  val += character.aaBonuses.hp + 5;
  if (!unbuffed) val += character.spellBonuses.hp;

  // this MaxHPChange bonus is only used in AAs on TAKP, not in items or spells, so this line doesn't do anything
  //val += val * ((character.spellBonuses.MaxHPChange + character.itemBonuses.MaxHPChange) / 10000.0f);

  if (val > 32767) val = 32767;

  // idk what this shit is.
  // if (!unbuffed)
  // {
  // 	if (cur_hp > val)
  // 		cur_hp = val;
  // 	max_hp = val;
  // }

  return val;
};

const mobGetClassLevelFactor = (character: Character) => {
  let multiplier = 0;
  let mlevel = character.level;
  switch (character.classId) {
    case Classes.Warrior: {
      if (mlevel < 20) multiplier = 220;
      else if (mlevel < 30) multiplier = 230;
      else if (mlevel < 40) multiplier = 250;
      else if (mlevel < 53) multiplier = 270;
      else if (mlevel < 57) multiplier = 280;
      else if (mlevel < 60) multiplier = 290;
      else if (mlevel < 70) multiplier = 300;
      else multiplier = 311;
      break;
    }
    case Classes.Druid:
    case Classes.Cleric:
    case Classes.Shaman: {
      if (mlevel < 70) multiplier = 150;
      else multiplier = 157;
      break;
    }
    case Classes.Paladin:
    case Classes.ShadowKnight: {
      if (mlevel < 35) multiplier = 210;
      else if (mlevel < 45) multiplier = 220;
      else if (mlevel < 51) multiplier = 230;
      else if (mlevel < 56) multiplier = 240;
      else if (mlevel < 60) multiplier = 250;
      else if (mlevel < 68) multiplier = 260;
      else multiplier = 270;
      break;
    }
    case Classes.Monk:
    case Classes.Bard:
    case Classes.Rogue:
    case Classes.Beastlord: {
      if (mlevel < 51) multiplier = 180;
      else if (mlevel < 58) multiplier = 190;
      else if (mlevel < 70) multiplier = 200;
      else multiplier = 210;
      break;
    }
    case Classes.Ranger: {
      if (mlevel < 58) multiplier = 200;
      else if (mlevel < 70) multiplier = 210;
      else multiplier = 220;
      break;
    }
    case Classes.Magician:
    case Classes.Wizard:
    case Classes.Necromancer:
    case Classes.Enchanter: {
      if (mlevel < 70) multiplier = 120;
      else multiplier = 127;
      break;
    }
    default: {
      if (mlevel < 35) multiplier = 210;
      else if (mlevel < 45) multiplier = 220;
      else if (mlevel < 51) multiplier = 230;
      else if (mlevel < 56) multiplier = 240;
      else if (mlevel < 60) multiplier = 250;
      else multiplier = 260;
      break;
    }
  }
  return multiplier;
};

const clientCalcBaseHP = (character: Character, unbuffed: boolean) => {
  let lm = Math.floor(mobGetClassLevelFactor(character) / 10);
  let level_hp = character.level * lm;
  let sta_factor = character.stats.sta;
  // idk what this shit is
  // if (unbuffed) // web stats export uses this
  // {
  // 	sta_factor = CalcSTA(unbuffed);
  // }
  if (sta_factor > 255) {
    sta_factor = Math.floor((sta_factor - 255) / 2 + 255);
  }
  let val = Math.floor((level_hp * sta_factor) / 300 + level_hp);
  // if (!unbuffed)
  // 	base_hp = val;

  return val;
};

export const clientCalcMaxMana = (character: Character) => {
  let max_mana = 0;
  switch (mobGetCasterClass(character)) {
    case 'I':
    case 'W': {
      if (
        (character.classId == Classes.Ranger ||
          character.classId == Classes.Paladin ||
          character.classId == Classes.Beastlord) &&
        character.level < 9
      )
        max_mana = 0;
      else
        max_mana =
          clientCalcBaseMana(character) +
          character.itemBonuses.mana +
          character.spellBonuses.mana;
      break;
    }
    case 'N': {
      max_mana = 0;
      break;
    }
    default: {
      console.log('Invalid class when calculating max mana');
      max_mana = 0;
      break;
    }
  }
  if (max_mana < 0) {
    max_mana = 0;
  }

  if (max_mana > 32767) max_mana = 32767;

  // if (cur_mana > max_mana) {
  // 	cur_mana = max_mana;
  // }
  // #if EQDEBUG >= 11
  // 	Log(Logs::Detail, Logs::Spells, "Client::CalcMaxMana() called for %s - returning %d", GetName(), max_mana);
  // #endif
  return max_mana;
};

const clientCalcBaseMana = (character: Character) => {
  let WisInt = 0;
  let MindLesserFactor, MindFactor;
  let max_m = 0;
  switch (mobGetCasterClass(character)) {
    case 'I':
      WisInt = character.stats.int;

      if ((WisInt - 199) / 2 > 0) MindLesserFactor = (WisInt - 199) / 2;
      else MindLesserFactor = 0;

      MindFactor = WisInt - MindLesserFactor;
      if (WisInt > 100)
        max_m = (((5 * (MindFactor + 20)) / 2) * 3 * character.level) / 40;
      else max_m = (((5 * (MindFactor + 200)) / 2) * 3 * character.level) / 100;
      break;

    case 'W':
      WisInt = character.stats.wis;

      if ((WisInt - 199) / 2 > 0) MindLesserFactor = (WisInt - 199) / 2;
      else MindLesserFactor = 0;

      MindFactor = WisInt - MindLesserFactor;
      if (WisInt > 100)
        max_m = (((5 * (MindFactor + 20)) / 2) * 3 * character.level) / 40;
      else max_m = (((5 * (MindFactor + 200)) / 2) * 3 * character.level) / 100;
      break;

    case 'N': {
      max_m = 0;
      break;
    }
    default: {
      console.log('Invalid class in calcMaxMana');
      max_m = 0;
      break;
    }
  }

  // #if EQDEBUG >= 11
  // 	Log(Logs::General, Logs::Spells, "Client::CalcBaseMana() called for %s - returning %d", GetName(), max_m);
  // #endif
  return Math.floor(max_m); // got lazy with this math.floor by adding it here; may need it above instead if this is inaccurate
};

const mobGetCasterClass = (character: Character) => {
  switch (character.classId) {
    case Classes.Cleric:
    case Classes.Paladin:
    case Classes.Ranger:
    case Classes.Druid:
    case Classes.Shaman:
    case Classes.Beastlord:
    case Classes.Cleric:
    case Classes.PaladinGM:
    case Classes.RangerGM:
    case Classes.Druid:
    case Classes.ShamanGM:
    case Classes.BeastlordGM:
      return 'W';
      break;

    case Classes.ShadowKnight:
    case Classes.Bard:
    case Classes.Necromancer:
    case Classes.Wizard:
    case Classes.Magician:
    case Classes.Enchanter:
    case Classes.ShadowKnightGM:
    case Classes.BardGM:
    case Classes.Necromancer:
    case Classes.Wizard:
    case Classes.Magician:
    case Classes.Enchanter:
      return 'I';
    default:
      return 'N';
  }
};

export const clientCalcMR = (
  character: Character,
  ignoreCap: boolean,
  includeSpells: boolean
) => {
  let calc;
  //racial bases
  switch (character.raceId) {
    case PlayableRaces.Human:
      calc = 25;
      break;
    case PlayableRaces.Barbarian:
      calc = 25;
      break;
    case PlayableRaces.Erudite:
      calc = 30;
      break;
    case PlayableRaces.WoodElf:
      calc = 25;
      break;
    case PlayableRaces.HighElf:
      calc = 25;
      break;
    case PlayableRaces.DarkElf:
      calc = 25;
      break;
    case PlayableRaces.HalfElf:
      calc = 25;
      break;
    case PlayableRaces.Dwarf:
      calc = 30;
      break;
    case PlayableRaces.Troll:
      calc = 25;
      break;
    case PlayableRaces.Ogre:
      calc = 25;
      break;
    case PlayableRaces.Halfling:
      calc = 25;
      break;
    case PlayableRaces.Gnome:
      calc = 25;
      break;
    case PlayableRaces.Iksar:
      calc = 25;
      break;
    case PlayableRaces.Vahshir:
      calc = 25;
      break;
    default:
      calc = 20;
  }

  calc += character.itemBonuses.mr + character.aaBonuses.mr;
  if (includeSpells) {
    calc += character.spellBonuses.mr;
  }

  if (character.classId == Classes.Warrior) calc += character.level / 2;

  if (calc < 1) calc = 1;

  if (!ignoreCap) {
    if (calc > getMaxMR(character)) calc = getMaxMR(character);
  }

  return calc;
};

export const clientCalcFR = (
  character: Character,
  ignoreCap: boolean,
  includeSpells: boolean
) => {
  let calc;

  //racial bases
  switch (character.raceId) {
    case PlayableRaces.Human:
      calc = 25;
      break;
    case PlayableRaces.Barbarian:
      calc = 25;
      break;
    case PlayableRaces.Erudite:
      calc = 25;
      break;
    case PlayableRaces.WoodElf:
      calc = 25;
      break;
    case PlayableRaces.HighElf:
      calc = 25;
      break;
    case PlayableRaces.DarkElf:
      calc = 25;
      break;
    case PlayableRaces.HalfElf:
      calc = 25;
      break;
    case PlayableRaces.Dwarf:
      calc = 25;
      break;
    case PlayableRaces.Troll:
      calc = 5;
      break;
    case PlayableRaces.Ogre:
      calc = 25;
      break;
    case PlayableRaces.Halfling:
      calc = 25;
      break;
    case PlayableRaces.Gnome:
      calc = 25;
      break;
    case PlayableRaces.Iksar:
      calc = 30;
      break;
    case PlayableRaces.Vahshir:
      calc = 25;
      break;
    default:
      calc = 20;
  }

  let c = character.classId;
  if (c == Classes.Ranger) {
    calc += 4;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Monk) {
    calc += 8;

    let l = character.level;
    if (l > 49) calc += l - 49;
  }

  calc += character.itemBonuses.fr + character.aaBonuses.fr;
  if (includeSpells) {
    calc += character.spellBonuses.fr;
  }

  if (calc < 1) calc = 1;

  if (!ignoreCap) {
    if (calc > getMaxFR(character)) calc = getMaxFR(character);
  }

  return calc;
};

export const clientCalcDR = (
  character: Character,
  ignoreCap: boolean,
  includeSpells: boolean
) => {
  let calc;

  //racial bases
  switch (character.raceId) {
    case PlayableRaces.Human:
      calc = 15;
      break;
    case PlayableRaces.Barbarian:
      calc = 15;
      break;
    case PlayableRaces.Erudite:
      calc = 10;
      break;
    case PlayableRaces.WoodElf:
      calc = 15;
      break;
    case PlayableRaces.HighElf:
      calc = 15;
      break;
    case PlayableRaces.DarkElf:
      calc = 15;
      break;
    case PlayableRaces.HalfElf:
      calc = 15;
      break;
    case PlayableRaces.Dwarf:
      calc = 15;
      break;
    case PlayableRaces.Troll:
      calc = 15;
      break;
    case PlayableRaces.Ogre:
      calc = 15;
      break;
    case PlayableRaces.Halfling:
      calc = 20;
      break;
    case PlayableRaces.Gnome:
      calc = 15;
      break;
    case PlayableRaces.Iksar:
      calc = 15;
      break;
    case PlayableRaces.Vahshir:
      calc = 15;
      break;
    default:
      calc = 15;
  }

  let c = character.classId;
  if (c == Classes.Paladin) {
    calc += 8;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.ShadowKnight) {
    calc += 4;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Beastlord) {
    calc += 4;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Monk) {
    let l = character.level;
    if (l > 50) calc += l - 50;
  }

  calc += character.itemBonuses.dr + character.aaBonuses.dr;
  if (includeSpells) {
    calc += character.spellBonuses.dr;
  }

  if (calc < 1) calc = 1;

  if (!ignoreCap) {
    if (calc > getMaxDR(character)) calc = getMaxDR(character);
  }

  return calc;
};

export const clientCalcPR = (
  character: Character,
  ignoreCap: boolean,
  includeSpells: boolean
) => {
  let calc;

  //racial bases
  switch (character.raceId) {
    case PlayableRaces.Human:
      calc = 15;
      break;
    case PlayableRaces.Barbarian:
      calc = 15;
      break;
    case PlayableRaces.Erudite:
      calc = 15;
      break;
    case PlayableRaces.WoodElf:
      calc = 15;
      break;
    case PlayableRaces.HighElf:
      calc = 15;
      break;
    case PlayableRaces.DarkElf:
      calc = 15;
      break;
    case PlayableRaces.HalfElf:
      calc = 15;
      break;
    case PlayableRaces.Dwarf:
      calc = 20;
      break;
    case PlayableRaces.Troll:
      calc = 15;
      break;
    case PlayableRaces.Ogre:
      calc = 15;
      break;
    case PlayableRaces.Halfling:
      calc = 20;
      break;
    case PlayableRaces.Gnome:
      calc = 15;
      break;
    case PlayableRaces.Iksar:
      calc = 15;
      break;
    case PlayableRaces.Vahshir:
      calc = 15;
      break;
    default:
      calc = 15;
  }

  let c = character.classId;
  if (c == Classes.Rogue) {
    calc += 8;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.ShadowKnight) {
    calc += 4;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Monk) {
    let l = character.level;
    if (l > 50) calc += l - 50;
  }

  calc += character.itemBonuses.pr + character.aaBonuses.pr;
  if (includeSpells) {
    calc += character.spellBonuses.pr;
  }

  if (calc < 1) calc = 1;

  if (!ignoreCap) {
    if (calc > getMaxPR(character)) calc = getMaxPR(character);
  }

  return calc;
};

export const clientCalcCR = (
  character: Character,
  ignoreCap: boolean,
  includeSpells: boolean
) => {
  let calc;

  //racial bases
  switch (character.raceId) {
    case PlayableRaces.Human:
      calc = 25;
      break;
    case PlayableRaces.Barbarian:
      calc = 35;
      break;
    case PlayableRaces.Erudite:
      calc = 25;
      break;
    case PlayableRaces.WoodElf:
      calc = 25;
      break;
    case PlayableRaces.HighElf:
      calc = 25;
      break;
    case PlayableRaces.DarkElf:
      calc = 25;
      break;
    case PlayableRaces.HalfElf:
      calc = 25;
      break;
    case PlayableRaces.Dwarf:
      calc = 25;
      break;
    case PlayableRaces.Troll:
      calc = 25;
      break;
    case PlayableRaces.Ogre:
      calc = 25;
      break;
    case PlayableRaces.Halfling:
      calc = 25;
      break;
    case PlayableRaces.Gnome:
      calc = 25;
      break;
    case PlayableRaces.Iksar:
      calc = 15;
      break;
    case PlayableRaces.Vahshir:
      calc = 25;
      break;
    default:
      calc = 25;
  }

  let c = character.classId;
  if (c == Classes.Ranger) {
    calc += 4;

    let l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Beastlord) {
    calc += 4;

    let l = character.level;
    if (l > 49) calc += l - 49;
  }

  calc += character.itemBonuses.cr + character.aaBonuses.cr;
  if (includeSpells) {
    calc += character.spellBonuses.cr;
  }

  if (calc < 1) calc = 1;

  if (!ignoreCap) {
    if (calc > getMaxCR(character)) calc = getMaxCR(character);
  }

  return calc;
};

export const clientCalcAC = (character: Character) => {
  // this is the value displayed in clients (it ignores the softcap) and is not used in combat calculations
  const AC = Math.floor(
    ((clientGetAvoidance(character) + getMitigation(character, true)) * 1000) /
      847
  );
  return AC;
};

const MAX_RESIST = 500;

const getMaxPR = (character: Character) =>
  MAX_RESIST; /* plus AA resist cap increases later */
const getMaxDR = (character: Character) =>
  MAX_RESIST; /* plus AA resist cap increases later */
const getMaxMR = (character: Character) =>
  MAX_RESIST; /* plus AA resist cap increases later */
const getMaxFR = (character: Character) =>
  MAX_RESIST; /* plus AA resist cap increases later */
const getMaxCR = (character: Character) =>
  MAX_RESIST; /* plus AA resist cap increases later */

export const getATK = (character: Character) => {
  return Math.floor(
    ((getToHitByHand(character) + mobGetOffenseByHand(character)) * 1000) / 744
  );
};

const clientGetHasteCap = (character: Character) => {
  if (character.level > 59)
    // 60+
    // cap += RuleI(Character, HasteCap);
    return 1.0;
  else if (character.level > 50)
    // 51-59
    return 0.85;
  // 1-50
  else return (character.level + 25) / 100;
};

export const getMaxWornHastePercent = (character: Character) => {
  const maxWornHaste = Math.max(
    ...character.slots.map((slot) =>
      slot.item ? getWornHastePercent(slot.item) : 0
    )
  );

  return Math.min(maxWornHaste, clientGetHasteCap(character));
};

const getWornHastePercent = (item: Item) => {
  const effectAsAny = item.wornEffect as any;
  if (!item.wornEffect) {
    return 0;
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
    return 0;
  }

  const formula = effectAsAny[`formula${hasteEffectIndex}`];
  const effectBase = effectAsAny[`effect_base_value${hasteEffectIndex}`];
  const effectLevel = item.wornlevel;

  const effectValue = getEffectValue(formula, effectBase, effectLevel, -1);
  return effectValue ? (effectValue - 100) / 100 : 0;
};

const getEffectValue = (
  formula: number,
  effectBase: number,
  effectLevel: number,
  spellLevel: number // idk what this is.
) => {
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
};
