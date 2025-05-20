import { Classes, classIds } from '../../api/classes';
import { ItemTypes, Skills } from '../../api/items';
import { playableRaceIds, PlayableRaces } from '../../api/race';
import { Slots } from '../../api/slots';
import { Item } from '../../items/item.entity';
import { bitmaskIncludesId } from '../../utils';
import { Character, Slot } from './quarm.character';
import { rollDecimal, rollD20, int, rollInt } from './quarm.random';

export const TwoHandedItemTypes = [
  ItemTypes.TwoHandSlashing,
  ItemTypes.TwoHandBlunt,
  ItemTypes.TwoHandPiercing,
];

export const getClientDamageBonus = (character: Character) => {
  const { level, classId, slots } = character;
  if (level < 28 || !isWarriorClass(classId)) return 0;

  let delay = 1;
  let bonus = 1 + (level - 28) / 3;

  const item = slots.find((slot) => slot.slotName === 'Primary')?.item as Item; // TODO:  actually set the full item to this, or at least add attack/delay to the partial
  if (item) {
    delay = item.delay;
  } else {
    delay = getHandToHandDelay(character);
  }

  if (item && TwoHandedItemTypes.includes(item.itemtype)) {
    if (delay <= 27) {
      return bonus + 1;
    }

    if (level > 29) {
      let level_bonus = (level - 30) / 5 + 1;
      if (level > 50) {
        level_bonus++;
        let level_bonus2 = level - 50;
        if (level > 67) {
          level_bonus2 += 5;
        } else if (level > 59) {
          level_bonus2 += 4;
        } else if (level > 58) {
          level_bonus2 += 3;
        } else if (level > 56) {
          level_bonus2 += 2;
        } else if (level > 54) {
          level_bonus2++;
        }
        level_bonus += (level_bonus2 * delay) / 40;
      }
      bonus += level_bonus;
    }
    if (delay >= 40) {
      let delay_bonus = (delay - 40) / 3 + 1;
      if (delay >= 45) {
        delay_bonus += 2;
      } else if (delay >= 43) {
        delay_bonus++;
      }
      bonus += delay_bonus;
    }
    return bonus;
  }
  return bonus;
};

export const getHandToHandDelay = (character: Character) => {
  let mnk_hum_delay = [
    99,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35, // 1-10
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35, // 11-20
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    34,
    34,
    34, // 21-30
    34,
    33,
    33,
    33,
    33,
    32,
    32,
    32,
    32,
    31, // 31-40
    31,
    31,
    31,
    30,
    30,
    30,
    30,
    29,
    29,
    29, // 41-50
    29,
    28,
    28,
    28,
    28,
    27,
    27,
    27,
    27,
    26, // 51-60
    24,
    22,
  ]; // 61-62
  let mnk_iks_delay = [
    99,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35, // 1-10
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35, // 11-20
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    34, // 21-30
    34,
    34,
    34,
    34,
    34,
    33,
    33,
    33,
    33,
    33, // 31-40
    33,
    32,
    32,
    32,
    32,
    32,
    32,
    31,
    31,
    31, // 41-50
    31,
    31,
    31,
    30,
    30,
    30,
    30,
    30,
    30,
    29, // 51-60
    25,
    23,
  ]; // 61-62
  let bst_delay = [
    99,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35, // 1-10
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35, // 11-20
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    35,
    34,
    34, // 21-30
    34,
    34,
    34,
    33,
    33,
    33,
    33,
    33,
    32,
    32, // 31-40
    32,
    32,
    32,
    31,
    31,
    31,
    31,
    31,
    30,
    30, // 41-50
    30,
    30,
    30,
    29,
    29,
    29,
    29,
    29,
    28,
    28, // 51-60
    28,
    28,
    28,
  ]; // 61-63

  const { raceId, classId, slots, level } = character;
  const hasMonkEpic = slots.some(
    (s) => s.slotName === 'Hands' && s.item && s.item.id === 10652
  ); // Celestial Fists, monk epic

  const isIksar = playableRaceIds[raceId] === 'IKS';
  const isMonk = classIds[classId] === 'MNK';
  const isBeastlord = classIds[classId] === 'BST';

  if (isMonk) {
    if (hasMonkEpic && level > 50) {
      return 16;
    }

    if (level > 62) {
      return isIksar ? 21 : 20;
    }

    return isIksar ? mnk_iks_delay[level] : mnk_hum_delay[level];
  } else if (isBeastlord) {
    if (level > 63) {
      return 27;
    }
    return bst_delay[level];
  }
  return 35;
};

const getHandToHandDamage = (character: Character, isClient: boolean) => {
  const mnk_dmg = [
    99,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    6, // 1-10
    6,
    6,
    6,
    6,
    7,
    7,
    7,
    7,
    7,
    8, // 11-20
    8,
    8,
    8,
    8,
    9,
    9,
    9,
    9,
    9,
    10, // 21-30
    10,
    10,
    10,
    10,
    11,
    11,
    11,
    11,
    11,
    12, // 31-40
    12,
    12,
    12,
    12,
    13,
    13,
    13,
    13,
    13,
    14, // 41-50
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14,
    14, // 51-60
    14,
    14,
  ]; // 61-62
  const bst_dmg = [
    99,
    4,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    5, // 1-10
    5,
    6,
    6,
    6,
    6,
    6,
    6,
    7,
    7,
    7, // 11-20
    7,
    7,
    7,
    8,
    8,
    8,
    8,
    8,
    8,
    9, // 21-30
    9,
    9,
    9,
    9,
    9,
    10,
    10,
    10,
    10,
    10, // 31-40
    10,
    11,
    11,
    11,
    11,
    11,
    11,
    12,
    12,
  ]; // 41-49

  const { raceId, classId, slots, level } = character;
  const hasMonkEpic = slots.some(
    (s) => s.slotName === 'Hands' && s.item && s.item.id === 10652
  ); // Celestial Fists, monk epic
  const isMonk = classIds[classId] === 'MNK';
  const isBeastlord = classIds[classId] === 'BST';

  if (isMonk) {
    if (isClient && hasMonkEpic && level > 50)
      // Celestial Fists, monk epic
      return 9;
    if (level > 62) return 15;
    return mnk_dmg[level];
  } else if (isBeastlord) {
    if (level > 49) return 13;
    return bst_dmg[level];
  }
  return 2;
};

export const isEquippable = (item: Item, character: Character) => {
  const { classId, raceId, level } = character;

  // Not high enough level
  if (item.reqlevel && item.reqlevel > level) {
    return false;
  }

  // Not the right race
  if (!bitmaskIncludesId(item.races, raceId)) {
    // console.log('not the right race');
    return false;
  }

  // Not the right class
  if (!bitmaskIncludesId(item.classes, classId - 1)) {
    // console.log(item.classes, classId);
    // console.log('not the right class');
    return false;
  }

  return true;
};

const calcRecommendedLevelBonus = (
  level: number,
  reclevel: number,
  basestat: number
) => {
  if (reclevel > 0 && level < reclevel) {
    let statmod = ((level * 10000) / reclevel) * basestat;

    if (statmod < 0) {
      statmod -= 5000;
      return statmod / 10000;
    } else {
      statmod += 5000;
      return statmod / 10000;
    }
  }

  return 0;
};

const getClientBaseDamage = (character: Character, slotId: number) => {
  const isPrimary = slotId === Slots.Primary;
  const isSecondary = slotId === Slots.Secondary;
  const isRange = slotId === Slots.Range;
  const isAmmo = slotId === Slots.Ammo;

  let dmg = 0;

  if (!isSecondary && !isRange && !isAmmo) {
    slotId = Slots.Primary; // primary
  }

  const slot = character.slots.find((s) => s.slotIds.includes(slotId));
  // TODO:  ummm need Item here.
  const weapon = slot?.item as Item | undefined;

  if (weapon) {
    if (!isEquippable(weapon as Item, character)) {
      return dmg;
    }

    if (character.level < weapon.reclevel) {
      dmg = calcRecommendedLevelBonus(
        character.level,
        weapon.reclevel,
        weapon.damage
      );
    } else {
      dmg = weapon.damage;
    }

    // TODO: get to this later
    // if (weapon->ElemDmgAmt && !defender->GetSpecialAbility(IMMUNE_MAGIC))
    // {
    // 	int eledmg = 0;

    // 	if (GetLevel() < weapon->RecLevel)
    // 		eledmg = CastToClient()->CalcRecommendedLevelBonus(GetLevel(), weapon->RecLevel, weapon->ElemDmgAmt);
    // 	else
    // 		eledmg = weapon->ElemDmgAmt;

    // 	if (eledmg)
    // 	{
    // 		eledmg = CalcEleWeaponResist(eledmg, weapon->ElemDmgType, defender);
    // 		dmg += eledmg;
    // 	}
    // }

    // TODO:  Get to this later
    // if (weapon->BaneDmgBody == defender->GetBodyType() || weapon->BaneDmgRace == defender->GetRace())
    // {
    // 	if (GetLevel() < weapon->RecLevel)
    // 		dmg += CastToClient()->CalcRecommendedLevelBonus(GetLevel(), weapon->RecLevel, weapon->BaneDmgAmt);
    // 	else
    // 		dmg += weapon->BaneDmgAmt;
    // }

    const ammoSlot = character.slots.find((s) => s.slotName === 'Ammo') as Slot;
    if (isRange && ammoSlot.item) {
      dmg += getClientBaseDamage(character, Slots.Ammo);
    }
  } else if (isPrimary || isSecondary) {
    dmg = getHandToHandDamage(character, true);
  }

  return dmg;
};

//note: throughout this method, setting `damage` to a negative is a way to
//stop the attack calculations
export const clientAttack = (
  attacker: Character,
  defender: Character,
  hand: number
  // damagePct: number
) => {
  if (hand != Slots.Secondary) {
    hand = Slots.Primary;
  }

  // 	// calculate attack_skill and skillinuse depending on hand and weapon
  // 	// also send Packet to near clients
  // 	EQ::skills::SkillType skillinuse;

  // 	AttackAnimation(skillinuse, hand, weapon);
  // 	Log(Logs::Detail, Logs::Combat, "Attacking with %s in slot %d using skill %d", weapon?weapon->GetItem()->Name:"Fist", hand, skillinuse);

  // 	AddWeaponAttackFatigue(weapon);

  // Now figure out damage
  let damage = 1;
  const mylevel = attacker.level;
  let baseDamage = getClientBaseDamage(attacker, hand);

  // anti-twink damage caps.  Taken from decompiles
  if (mylevel < 10) {
    switch (attacker.classId) {
      case Classes.Druid:
      case Classes.Cleric:
      case Classes.Shaman:
        if (baseDamage > 9) baseDamage = 9;
        break;
      case Classes.Wizard:
      case Classes.Magician:
      case Classes.Necromancer:
      case Classes.Enchanter:
        if (baseDamage > 6) baseDamage = 6;
        break;
      default:
        if (baseDamage > 10) baseDamage = 10;
    }
  } else if (mylevel < 20) {
    switch (attacker.classId) {
      case Classes.Druid:
      case Classes.Cleric:
      case Classes.Shaman:
        if (baseDamage > 12) baseDamage = 12;
        break;
      case Classes.Wizard:
      case Classes.Magician:
      case Classes.Enchanter:
      case Classes.Necromancer:
        if (baseDamage > 10) baseDamage = 10;
        break;
      default:
        if (baseDamage > 14) baseDamage = 14;
    }
  } else if (mylevel < 30) {
    switch (attacker.classId) {
      case Classes.Druid:
      case Classes.Cleric:
      case Classes.Shaman:
        if (baseDamage > 20) baseDamage = 20;
        break;
      case Classes.Wizard:
      case Classes.Magician:
      case Classes.Enchanter:
      case Classes.Necromancer:
        if (baseDamage > 12) baseDamage = 12;
        break;
      default:
        if (baseDamage > 30) baseDamage = 30;
    }
  } else if (mylevel < 40) {
    switch (attacker.classId) {
      case Classes.Druid:
      case Classes.Cleric:
      case Classes.Shaman:
        if (baseDamage > 26) baseDamage = 26;
        break;
      case Classes.Wizard:
      case Classes.Magician:
      case Classes.Necromancer:
      case Classes.Enchanter:
        if (baseDamage > 18) baseDamage = 18;
        break;
      default:
        if (baseDamage > 60) baseDamage = 60;
    }
  }
  /*
	// these are in the decompile but so unrealistic, commenting them out for cycles
	// also caps GM weapons
	else
	{
		switch (GetClass())
		{
		case DRUID:
		case CLERIC:
		case SHAMAN:
			if (baseDamage > 80)
				baseDamage = 80;
			break;
		case WIZARD:
		case MAGICIAN:
		case NECROMANCER:
		case ENCHANTER:
			if (baseDamage > 40)
				baseDamage = 40;
			break;
		default:
			if (baseDamage > 200)
				baseDamage = 200;
		}
	}*/
  let damageBonus = 0;
  if (hand === Slots.Primary) {
    damageBonus = getClientDamageBonus(attacker);
  }

  let hate = baseDamage + damageBonus;

  // TODO: do this immune stuff later
  // 	if (other->IsImmuneToMelee(this, hand))
  // 	{
  // 		damage = DMG_INVUL;
  // 	}
  // 	else
  // 	{
  // check avoidance skills
  let avoidStatus = avoidDamage(attacker, defender);

  // if (damage < 0 && (damage == DMG_DODGE || damage == DMG_PARRY || damage == DMG_RIPOSTE || damage == DMG_BLOCK)
  // 	&& aabonuses.StrikeThrough && zone->random.Roll(aabonuses.StrikeThrough))
  // {
  // 	damage = 1;		// Warrior Tactical Mastery AA
  // }

  //riposte
  // if (damage == DMG_RIPOSTE)
  // {
  //     DoRiposte(other);
  //     if (IsDead()) return false;
  // }

  // swing not avoided by skills; do avoidance AC check
  if (avoidStatus === AvoidanceStatus.None) {
    avoidStatus = mobAvoidanceCheck(attacker, hand, defender);
  }

  // 		if (damage > 0)
  // 		{
  // 			//try a finishing blow.. if successful end the attack
  // 			if(TryFinishingBlow(other, skillinuse, damageBonus))
  // 				return (true);
  const attackerItem = attacker.slots.find((s) =>
    s.slotIds.includes(hand)
  )?.item;
  const skillInUse = getSkillByItemType(attackerItem?.itemtype);
  damage =
    damageBonus + calcMeleeDamage(attacker, defender, baseDamage, skillInUse);

  // 			if (damagePct <= 0)
  // 				damagePct = 100;
  // 			damage = damage * damagePct / 100;

  // 			other->TryShielderDamage(this, damage, skillinuse);		// warrior /shield
  damage = tryCriticalHit(
    attacker,
    defender,
    skillInUse,
    damage,
    baseDamage,
    damageBonus
  );

  return { avoidStatus, damage: Math.round(damage) };
  // return avoidStatus === AvoidanceStatus.None ? damage : avoidStatus;

  // 			CheckIncreaseSkill(skillinuse, other, zone->skill_difficulty[skillinuse].difficulty);
  // 			CheckIncreaseSkill(EQ::skills::SkillOffense, other, zone->skill_difficulty[EQ::skills::SkillOffense].difficulty);

  // 			Log(Logs::Detail, Logs::Combat, "Damage calculated to %d (str %d, skill %d, DMG %d, lv %d)",
  // 				damage, GetSTR(), GetSkill(skillinuse), baseDamage, mylevel);
  // 		}
  // 	}

  // 	// Hate Generation is on a per swing basis, regardless of a hit, miss, or block, its always the same.
  // 	// If we are this far, this means we are atleast making a swing.
  // 	other->AddToHateList(this, hate);

  // 	///////////////////////////////////////////////////////////
  // 	////// Send Attack Damage
  // 	///////////////////////////////////////////////////////////
  // 	other->Damage(this, damage, SPELL_UNKNOWN, skillinuse);

  // 	if (IsDead()) return false;

  // 	MeleeLifeTap(damage);

  // 	// old rogue poison from apply poison skill.  guaranteed procs first hit then fades
  // 	if (poison_spell_id && damage > 0 && hand == EQ::invslot::slotPrimary && skillinuse == EQ::skills::Skill1HPiercing)
  // 	{
  // 		ExecWeaponProc(weapon, poison_spell_id, other);
  // 		poison_spell_id = 0;
  // 	}

  // 	CommonBreakInvisNoSneak();

  // 	if (damage > 0)
  // 		return true;

  // 	else
  // 		return false;
};

export enum AvoidanceStatus {
  None, // not avoided
  Block,
  Parry,
  Riposte,
  Dodge,
  Miss,
}

const avoidDamage = (
  attacker: Character,
  defender: Character,
  inFront: boolean = true,
  noRiposte: boolean = false,
  isRangedAttack: boolean = false
) => {
  /* solar: called when a mob is attacked, does the checks to see if it's a hit
   * and does other mitigation checks. 'this' is the mob being attacked.
   *
   * special return values:
   * -1 - block
   * -2 - parry
   * -3 - riposte
   * -4 - dodge
   *
   */

  // block
  const blockSkill = defender.maxSkills[Skills.Block];
  if (blockSkill) {
    // if (IsClient())
    // 	CastToClient()->CheckIncreaseSkill(EQ::skills::SkillBlock, attacker, zone->skill_difficulty[EQ::skills::SkillBlock].difficulty);

    // 	// check auto discs ... I guess aa/items too :P
    // if (spellbonuses.IncreaseBlockChance == 10000 || aabonuses.IncreaseBlockChance == 10000 ||
    // 	itembonuses.IncreaseBlockChance == 10000) {
    // 	damage = DMG_BLOCK;
    // 	return true;
    // }
    let chance = blockSkill + 100;
    chance +=
      chance /** (aabonuses.IncreaseBlockChance + spellbonuses.IncreaseBlockChance + itembonuses.IncreaseBlockChance)*/ /
      100;
    chance /= 25;

    if (rollInt(chance)) {
      return AvoidanceStatus.Block;
    }
  }

  // parry
  const parrySkill = defender.maxSkills[Skills.Parry];
  if (parrySkill && inFront && !isRangedAttack) {
    // if (IsClient())
    // 	CastToClient()->CheckIncreaseSkill(EQ::skills::SkillParry, attacker, zone->skill_difficulty[EQ::skills::SkillParry].difficulty);

    // check auto discs ... I guess aa/items too :P
    // if (spellbonuses.ParryChance == 10000 || aabonuses.ParryChance == 10000 || itembonuses.ParryChance == 10000) {
    // 	damage = DMG_PARRY;
    // 	return true;
    // }
    let chance = parrySkill + 100;
    chance +=
      chance /** (aabonuses.ParryChance + spellbonuses.ParryChance + itembonuses.ParryChance)*/ /
      100;
    chance /= 50; // this is 45 in modern EQ.  Old EQ logs parsed to a lower parry rate, so raising this

    if (rollInt(chance)) {
      return AvoidanceStatus.Parry;
    }
  }

  // riposte
  const riposteSkill = defender.maxSkills[Skills.Riposte];
  if (!noRiposte && !isRangedAttack && riposteSkill && inFront) {
    let cannotRiposte = false;

    if (defender.isClient) {
      const item = defender.slots.find((s) => s.slotName === 'Primary')?.item;
      if (item && !isWeapon(item as Item)) {
        // TODO: actually use an item.
        cannotRiposte = true;
      }
      // else
      // {
      // 	CastToClient()->CheckIncreaseSkill(EQ::skills::SkillRiposte, attacker, zone->skill_difficulty[EQ::skills::SkillRiposte].difficulty);
      // }
    }

    // riposting ripostes is possible, but client attacks become unripable while under a rip disc
    // if (attacker->IsEnraged() ||
    // 	(attacker->IsClient() && (attacker->aabonuses.RiposteChance + attacker->spellbonuses.RiposteChance + attacker->itembonuses.RiposteChance) >= 10000)
    // )
    // 	cannotRiposte = true;

    if (!cannotRiposte) {
      // if (IsEnraged() || spellbonuses.RiposteChance == 10000 || aabonuses.RiposteChance == 10000 || itembonuses.RiposteChance == 10000)
      // {
      // 	damage = DMG_RIPOSTE;
      // 	return true;
      // }

      let chance = riposteSkill + 100;
      chance +=
        chance /** (aabonuses.RiposteChance + spellbonuses.RiposteChance + itembonuses.RiposteChance)*/ /
        100;
      chance /= 55; // this is 50 in modern EQ.  Old EQ logs parsed to a lower rate, so raising this

      if (chance > 0 && rollInt(chance)) {
        // could be <0 from offhand stuff
        // March 19 2002 patch made pets not take non-enrage ripostes from NPCs.  it said 'more likely to avoid' but player comments say zero and logs confirm
        // if (IsNPC() && attacker->IsPet())
        // {
        // 	damage = DMG_MISS;  // converting ripostes to misses.  don't know what Sony did but erring on conservative
        // 	return true;
        // }

        return AvoidanceStatus.Riposte;
      }
    }
  }

  // dodge
  const dodgeSkill = defender.maxSkills[Skills.Dodge];
  if (dodgeSkill) {
    // if (IsClient())
    // 	CastToClient()->CheckIncreaseSkill(EQ::skills::SkillDodge, attacker, zone->skill_difficulty[EQ::skills::SkillDodge].difficulty);

    // check auto discs ... I guess aa/items too :P
    // if (spellbonuses.DodgeChance == 10000 || aabonuses.DodgeChance == 10000 || itembonuses.DodgeChance == 10000) {
    // 	damage = DMG_DODGE;
    // 	return true;
    // }
    let chance = dodgeSkill + 100;
    chance +=
      chance /** (aabonuses.DodgeChance + spellbonuses.DodgeChance + itembonuses.DodgeChance)*/ /
      100;
    chance /= 45;

    if (rollInt(chance)) {
      return AvoidanceStatus.Dodge;
    }
  }

  return AvoidanceStatus.None;
};

const mobAvoidanceCheck = (
  attacker: Character,
  hand: number,
  defender: Character
) => {
  // if (IsClient() && CastToClient()->IsSitting())
  // {
  // 	return true;
  // }

  const attackerItem = attacker.slots.find((s) =>
    s.slotIds.includes(hand)
  )?.item;
  const skillInUse = getSkillByItemType(attackerItem?.itemtype);

  let toHit = getToHit(attacker, skillInUse);
  let avoidance = defender.isClient
    ? clientGetAvoidance(defender)
    : mobGetAvoidance(defender);
  // const percentMod = 0;

  // Log(Logs::Detail, Logs::Attack, "AvoidanceCheck: %s attacked by %s;  Avoidance: %i  To-Hit: %i", defender->GetName(), attacker->GetName(), avoidance, toHit);

  // Hit Chance percent modifier
  // Disciplines: Evasive, Precision, Deadeye, Trueshot, Charge
  // percentMod = attacker->itembonuses.HitChanceEffect[skillinuse] +
  // 	attacker->spellbonuses.HitChanceEffect[skillinuse] +
  // 	attacker->aabonuses.HitChanceEffect[skillinuse] +
  // 	attacker->itembonuses.HitChanceEffect[EQ::skills::HIGHEST_SKILL + 1] +
  // 	attacker->spellbonuses.HitChanceEffect[EQ::skills::HIGHEST_SKILL + 1] +
  // 	attacker->aabonuses.HitChanceEffect[EQ::skills::HIGHEST_SKILL + 1];

  // Avoidance chance percent modifier
  // Disciplines: Evasive, Precision, Voiddance, Fortitude
  // percentMod -= (defender->spellbonuses.AvoidMeleeChanceEffect + defender->itembonuses.AvoidMeleeChanceEffect);

  // if (percentMod != 0)
  // {
  // 	if (skillinuse == EQ::skills::SkillArchery && percentMod > 0)
  // 		percentMod -= static_cast<int>(static_cast<float>(percentMod) * RuleR(Combat, ArcheryHitPenalty));

  // 	Log(Logs::Detail, Logs::Attack, "Modified chance to hit: %i%%", percentMod);

  // 	if (percentMod > 0)
  // 	{
  // 		if (zone->random.Roll(percentMod))
  // 		{
  // 			Log(Logs::Detail, Logs::Attack, "Modified Hit");
  // 			return true;
  // 		}
  // 	}
  // 	else
  // 	{
  // 		if (zone->random.Roll(-percentMod))
  // 		{
  // 			Log(Logs::Detail, Logs::Attack, "Modified Miss");
  // 			return false;
  // 		}
  // 	}
  // }

  // This produces precise output.  Don't change this unless you have Sony's actual code
  let hitChance: number;
  toHit += 10;
  avoidance += 10;

  if (toHit * 1.21 > avoidance) {
    hitChance = 1.0 - avoidance / (toHit * 1.21 * 2.0);
  } else {
    hitChance = (toHit * 1.21) / (avoidance * 2.0);
  }

  if (Math.random() < hitChance) {
    // Log(Logs::Detail, Logs::Attack, "Hit;  Hit chance was %0.1f%%", hitChance*100);
    return AvoidanceStatus.None;
  }

  // if (IsClient() && attacker->IsNPC())
  // 	CastToClient()->CheckIncreaseSkill(EQ::skills::SkillDefense, attacker, zone->skill_difficulty[EQ::skills::SkillDefense].difficulty);

  // Log(Logs::Detail, Logs::Attack, "Miss;  Hit chance was %0.1f%%", hitChance * 100);
  return AvoidanceStatus.Miss;
};

const mobGetAvoidance = (character: Character) => {
  const level = character.level;
  let avoidance = level * 9 + 5;

  if (level <= 50 && avoidance > 400) avoidance = 400;
  else if (avoidance > 460) avoidance = 460;

  // this is how Live does it for PCs and NPCs.  AK might have (likely) been different.  Can't know how AK did it.
  // but the difference is so small nobody would notice
  avoidance +=
    ((character.spellBonuses.agi + character.itemBonuses.agi) * 22) / 100;
  // avoidance += bonusAvoidance;
  if (avoidance < 1) avoidance = 1;

  return avoidance;
};

// this output is precise and is based on https://forums.daybreakgames.com/eq/index.php?threads/ac-vs-acv2.210028/
export const clientGetAvoidance = (character: Character) => {
  const defense_skill_value = character.maxSkills[Skills.Defense];
  const agi = character.stats.agi || 50; // todo: idk, guarantee I'll have AGI here.
  const level = character.level;

  let computedDefense = 1;
  let defenseAvoidance = 0;

  if (defense_skill_value > 0) {
    defenseAvoidance = Math.floor((defense_skill_value * 400) / 225);
  }

  // max agility bonus (called agiAvoidance here) is 53 with level > 40 and AGI 200
  // defense 252 (WAR PAL SHD MNK BRD ROG ) = 448 + 53 = 501
  // defense 240 (RNG BST) = 426 + 53 = 479
  // defense 200 (CLR DRU SHM) = 355 + 53 = 408
  // defense 145 (NEC WIZ MAG ENC) = 257 + 53 = 310

  // note: modern EQ does this here: GetAGI() > 40 ? (GetAGI() - 40) * 8000 / 36000 : 0;
  // old clients had a different calculation.  This is the precise output, based on a decompile done by Secrets
  let agiAvoidance = 0;
  if (agi < 40) {
    // 0-39 AGI = -25 to 0
    agiAvoidance = Math.floor((25 * (agi - 40)) / 40);
  } else if (agi >= 60 && agi <= 74) {
    // 40-60 AGI = 0
    agiAvoidance = Math.floor((2 * (28 - (200 - agi) / 5)) / 3);
  } else if (agi >= 75) {
    // 75-200 AGI = 6 to 53
    // AGI over 200 provides no further benefit for this bonus

    // 36 to 53
    let bonusAdj = 80;

    if (level < 7) {
      // 6 to 23
      bonusAdj = 35;
    } else if (level < 20) {
      // 20 to 36
      bonusAdj = 55;
    } else if (level < 40) {
      // 30 to 46
      bonusAdj = 70;
    }

    if (agi < 200) {
      agiAvoidance = Math.floor((2 * (bonusAdj - (200 - agi) / 5)) / 3);
    } else {
      agiAvoidance = Math.floor((2 * bonusAdj) / 3);
    }
  }

  computedDefense = defenseAvoidance + agiAvoidance;

  // combat agility scaling
  // computedDefense += computedDefense * combat_agility_percent / 100;

  // int drunk_factor = intoxication / 2;
  // if (drunk_factor > 20)
  // {
  // 	int drunk_multiplier = 110 - drunk_factor;
  // 	if (drunk_multiplier > 100)
  // 	{
  // 		drunk_multiplier = 100;
  // 	}
  // 	computedDefense = computedDefense * drunk_multiplier / 100;
  // }

  if (computedDefense < 1) computedDefense = 1;

  return computedDefense;
};

const getToHit = (character: Character, skillId: number) => {
  let accuracy = 0;
  const offense = character.maxSkills[Skills.Offense];
  const weaponSkill = character.maxSkills[skillId];
  let toHit = 7 + offense + weaponSkill;

  if (character.isClient) {
    // accuracy = itembonuses.Accuracy[EQ::skills::HIGHEST_SKILL + 1] +
    // 	spellbonuses.Accuracy[EQ::skills::HIGHEST_SKILL + 1] +
    // 	aabonuses.Accuracy[EQ::skills::HIGHEST_SKILL + 1] +
    // 	aabonuses.Accuracy[skill] +
    // 	itembonuses.HitChance; //Item Mod 'Accuracy'
    // taken from a client decompile (credit: demonstar)
    // int drunkValue = CastToClient()->m_pp.intoxication / 2;
    // if (drunkValue > 20)
    // {
    // 	int drunkReduction = 110 - drunkValue;
    // 	if (drunkReduction > 100)
    // 		drunkReduction = 100;
    // 	toHit = toHit * drunkReduction / 100;
    // }
    // else if (GetClass() == WARRIOR && CastToClient()->IsBerserk()) // TODO: maybe should care about berserk
    // {
    // 	toHit += 2 * GetLevel() / 5;
    // }
  } else {
    // accuracy = CastToNPC()->GetAccuracyRating();	// database value // TODO: maybe should care, but it's only like 1000 NPCs out of 17k, get to it later.
    if (character.level < 3) accuracy += 2; // level 1 and 2 NPCs parsed a few points higher than expected
  }

  toHit += accuracy;
  return toHit;
};

export const getToHitByHand = (
  character: Character,
  hand: number = Slots.Primary
): number => {
  if (!character.isClient) return getToHitByHand(character, Skills.HandToHand);

  let weapon: Item;
  if (hand === Slots.Secondary) {
    weapon = character.slots.find((s) => s.slotIds.includes(Slots.Secondary))
      ?.item as Item;
  } else {
    weapon = character.slots.find((s) => s.slotIds.includes(Slots.Primary))
      ?.item as Item;
  }

  if (weapon && weapon.itemclass === 0) {
    const skillId = getSkillByItemType(weapon.itemtype);
    return getToHit(character, skillId);
  } else {
    return getToHit(character, Skills.HandToHand);
  }
};

export const mobGetOffenseByHand = (
  character: Character,
  hand: number = Slots.Primary
) => {
  let weapon: Item | undefined;

  if (hand != Slots.Secondary) hand = Slots.Primary;

  character.slots.find((slot) => slot.slotId === hand)?.item;
  weapon = character.slots.find(
    (slot) => slot.slotId === hand && slot.item && slot.item.itemclass === 0
  )?.item;

  if (weapon) {
    const skillId = getSkillByItemType(weapon.itemtype);
    return clientGetOffense(character, skillId);
  } else {
    return clientGetOffense(character, Skills.HandToHand);
  }
};

export const isWeapon = (item: Item | undefined) => {
  if (!item || item.itemclass !== 0) {
    // common item class
    return false;
  }

  if (item.itemtype === ItemTypes.FletchedArrows && item.damage !== 0) {
    return true;
  } else {
    return item.damage !== 0 && item.delay !== 0;
  }
};

const getSkillByItemType = (itemType: number | undefined) => {
  switch (itemType) {
    case ItemTypes.OneHandSlashing:
      return Skills.OneHandSlashing;
    case ItemTypes.TwoHandSlashing:
      return Skills.TwoHandSlashing;
    case ItemTypes.OneHandPiercing:
      return Skills.OneHandPiercing;
    case ItemTypes.OneHandBlunt:
      return Skills.OneHandBlunt;
    case ItemTypes.TwoHandBlunt:
      return Skills.TwoHandBlunt;
    case ItemTypes.TwoHandPiercing:
      return Skills.OneHandPiercing; // change to 2HPiercing once activated
    case ItemTypes.Archery:
      return Skills.Archery;
    case ItemTypes.Throwing:
    case ItemTypes.ThrownCastingItems:
      return Skills.Throwing;
    case ItemTypes.HandToHand:
      return Skills.HandToHand;
    default:
      return Skills.HandToHand;
  }
};

// For both Clients and NPCs.  Sony calls client weapon damage and innate NPC damage 'base damage'
// NPC base damage is essentially DI * 10.  Special skills have their own base damage
// All melee, archery and throwing damage should pass through here
// For reference, NPC damage is: minHit = DB + DI*1; maxHit = DB + DI*20.  Clients do the same, but get a multiplier after it
const calcMeleeDamage = (
  attacker: Character,
  defender: Character,
  baseDamage: number,
  skill: number
) => {
  if (!defender || !baseDamage) return 0;

  // ranged physical damage does half that of melee
  if (skill == Skills.Archery || (skill == Skills.Throwing && baseDamage > 1)) {
    baseDamage /= 2;
  }

  const offense = clientGetOffense(attacker, skill);

  // mitigation roll
  const roll = rollD20(offense, getMitigation(defender));

  // if (defender.isClient && defender->CastToClient()->IsSitting()) {
  // 	roll = 20;
  // }

  // SE_MinDamageModifier[186] for disciplines: Fellstrike, Innerflame, Duelist, Bestial Rage
  // min hit becomes 4 x weapon damage + 1 x damage bonus
  const minHit = baseDamage * /*GetMeleeMinDamageMod_SE(skill) / 100*/ 0;

  // SE_DamageModifier[185] for disciplines: Aggressive, Ashenhand, Bestial Rage, Defensive, Duelist,
  //                                         Fellstrike, Innerflame, Silentfist, Thunderkick
  // baseDamage += baseDamage * GetMeleeDamageMod_SE(skill) / 100;

  // SE_MeleeMitigation[168] for disciplines: Defensive (-50), Stonestance & Protective Spirit (-90)
  //											Aggressive (+50)
  // baseDamage += baseDamage * defender->GetSpellBonuses().MeleeMitigationEffect / 100;

  // if (defender->IsClient() && IsPet() && GetOwner()->IsClient()) {
  // 	// pets do reduced damage to clients in pvp
  // 	baseDamage /= 2;
  // }

  let damage = (roll * baseDamage + 5) / 10;
  if (damage < minHit) {
    damage = minHit;
  }
  if (damage < 1) {
    damage = 1;
  }

  if (attacker.isClient) {
    damage = clientRollDamageMultiplier(
      attacker,
      offense,
      damage,
      skill
    ).damage;
  }

  return damage;
};

const clientGetOffense = (character: Character, skillId: number) => {
  let statBonus;

  if (skillId == Skills.Archery || skillId == Skills.Throwing) {
    statBonus = character.stats.dex;
  } else {
    statBonus = character.stats.str;
  }

  let offense = Math.floor(
    character.maxSkills[skillId] +
      character.spellBonuses.atk +
      character.itemBonuses.atk +
      (statBonus >= 75 ? (2 * statBonus - 150) / 3 : 0)
  );
  if (offense < 1) offense = 1;

  if (character.classId == Classes.Ranger && character.level > 54) {
    offense = offense + character.level * 4 - 216;
  }

  return offense;
};

export const getMitigation = (
  character: Character,
  ignoreCap: boolean = false
) => {
  // shield AC is not capped, so this value is just added to the softcap
  let shield_ac = 0;
  const secondaryItem = character.slots.find((s) =>
    s.slotIds.includes(Slots.Secondary)
  )?.item;
  if (secondaryItem) {
    if (secondaryItem.itemtype == ItemTypes.Shield) {
      shield_ac = secondaryItem.ac || 0;
    }
  }

  // TODO:  care about weight?
  // const carried_weight = getWeight(character) / 10;

  return clientGetMitigation(
    ignoreCap,
    character.itemBonuses.ac,
    shield_ac,
    character.spellBonuses.ac,
    character.classId,
    character.level,
    character.raceId,
    0, // carried_weight,
    character.stats.agi,
    character.maxSkills[Skills.Defense],
    0
  );
};

const clientGetMitigation = (
  ignoreCap: boolean,
  item_ac_sum: number,
  shield_ac: number,
  spell_ac_sum: number,
  classnum: number,
  level: number,
  base_race: number,
  carried_weight: number,
  agi: number,
  defense_skill_value: number,
  combat_stability_percent: number
) => {
  let acSum = item_ac_sum;
  const playerClass = classnum;

  // add 33% to item AC for all but NEC WIZ MAG ENC
  if (
    playerClass != Classes.Necromancer &&
    playerClass != Classes.Wizard &&
    playerClass != Classes.Magician &&
    playerClass != Classes.Enchanter
  ) {
    acSum = Math.floor((4 * acSum) / 3);
  }

  // anti-twink
  if (!ignoreCap && level < 50 && acSum > level * 6 + 25) {
    acSum = level * 6 + 25;
  }

  if (playerClass == Classes.Monk) {
    let hardcap: number;
    let softcap: number;

    if (level < 15) {
      // 1-14
      hardcap = 30;
      softcap = 14;
    } else if (level <= 29) {
      // 15-29
      hardcap = 32;
      softcap = 15;
    } else if (level <= 44) {
      // 30-44
      hardcap = 34;
      softcap = 16;
    } else if (level <= 50) {
      // 45-50
      hardcap = 36;
      softcap = 17;
    } else if (level <= 54) {
      // 51-54
      hardcap = 38;
      softcap = 18;
    } else if (level <= 59) {
      // 55-59
      hardcap = 40;
      softcap = 20;
    } else if (level <= 61) {
      // 60-61
      hardcap = 45;
      softcap = 24;
    } else if (level <= 63) {
      // 62-63
      hardcap = 47;
      softcap = 24;
    } else if (level <= 64) {
      // 64
      hardcap = 50;
      softcap = 24;
    } else {
      // 65
      hardcap = 53;
      softcap = 24;
    }

    const weight = carried_weight;
    let acBonus = level + 5.0;

    if (weight <= softcap) {
      // 93 bonus at level 65 when under 24 weight
      acSum += Math.floor((acBonus * 4.0) / 3.0);
    } else if (weight > hardcap + 1) {
      // scales the penalty from -11 down to -93 at level 65 with 143 weight
      let penalty = level + 5.0;
      let multiplier = (weight - (hardcap - 10)) / 100.0;
      if (multiplier > 1.0) multiplier = 1.0;
      penalty = (4.0 * penalty) / 3.0;
      penalty = multiplier * penalty;

      acSum -= Math.floor(penalty);
    } else if (weight > softcap) {
      // scales the bonus from 93 down to 0 at level 65 with 39 weight
      let reduction = (weight - softcap) * 6.66667;
      if (reduction > 100.0) reduction = 100.0;
      reduction = (100.0 - reduction) / 100.0;
      acBonus *= reduction;
      if (acBonus < 0.0) acBonus = 0.0;
      acBonus = (4.0 * acBonus) / 3.0;

      acSum += Math.floor(acBonus);
    }
  } else if (playerClass == Classes.Rogue) {
    if (level >= 30 && agi > 75) {
      // this bonus is small, it gets maxed out at 12
      //   by level 50 with 80 agi
      //   by level 42 with 85 agi
      //   by level 38 with 90 agi
      //   by level 36 with 100 agi
      let levelScaler = level - 26;
      let acBonus = 0;

      if (agi < 80) {
        acBonus = levelScaler / 4;
      } else if (agi < 85) {
        acBonus = (levelScaler * 2) / 4;
      } else if (agi < 90) {
        acBonus = (levelScaler * 3) / 4;
      } else if (agi < 100) {
        acBonus = (levelScaler * 4) / 4;
      } else {
        acBonus = (levelScaler * 5) / 4;
      }

      if (acBonus > 12) acBonus = 12;

      acSum += Math.floor(acBonus);
    }
  } else if (playerClass == Classes.Beastlord) {
    if (level > 10) {
      // this bonus is small, it gets maxed out at 16
      //   by level 46 with 80 agi
      //   by level 33 with 85 agi
      //   by level 26 with 90 agi
      //   by level 22 with 100 agi
      let levelScaler = level - 6;
      let acBonus = 0;

      if (agi < 80) {
        acBonus = levelScaler / 5;
      } else if (agi < 85) {
        acBonus = (levelScaler * 2) / 5;
      } else if (agi < 90) {
        acBonus = (levelScaler * 3) / 5;
      } else if (agi < 100) {
        acBonus = (levelScaler * 4) / 5;
      } else {
        acBonus = (levelScaler * 5) / 5;
      }

      if (acBonus > 16) acBonus = 16;

      acSum += Math.floor(acBonus);
    }
  }
  if (base_race == PlayableRaces.Iksar) {
    if (level < 10) {
      acSum += 10;
    } else if (level > 35) {
      acSum += 35;
    } else {
      acSum += level;
    }
  }

  if (acSum < 0) acSum = 0;

  let defense = defense_skill_value;
  if (defense > 0) {
    if (
      playerClass == Classes.Wizard ||
      playerClass == Classes.Necromancer ||
      playerClass == Classes.Enchanter ||
      playerClass == Classes.Magician
    ) {
      acSum += Math.floor(defense / 2);
    } else {
      acSum += Math.floor(defense / 3);
    }
  }

  let spellACDivisor = 4;
  if (
    playerClass == Classes.Wizard ||
    playerClass == Classes.Necromancer ||
    playerClass == Classes.Enchanter ||
    playerClass == Classes.Magician
  ) {
    spellACDivisor = 3;
  }
  acSum += spell_ac_sum / spellACDivisor;

  if (agi > 70) acSum += Math.floor(agi / 20);

  if (acSum < 0) acSum = 0;

  let softcap = 350; // AC cap is 350 for all classes in Classic era and for levels 50 and under

  if (level > 50) {
    // TODO:  uncomment when velious comes out
    // if (content_service.IsTheScarsOfVeliousEnabled()) { // earliest known client with these caps is April 4, 2001; defaulting this to Velious Era
    // 	switch (playerClass) {
    // 		case WARRIOR: {
    // 			softcap = 430;
    // 			break;
    // 		}
    // 		case PALADIN:
    // 		case SHADOWKNIGHT:
    // 		case CLERIC:
    // 		case BARD: {
    // 			softcap = 403;
    // 			break;
    // 		}
    // 		case RANGER:
    // 		case SHAMAN: {
    // 			softcap = 375;
    // 			break;
    // 		}
    // 		case MONK: {
    // 			softcap = RuleB(AlKabor, ReducedMonkAC) ? 315 : 350;
    // 			break;
    // 		}
    // 		default: {
    // 			softcap = 350;		// dru, rog, wiz, ench, nec, mag, bst
    // 		}
    // 	}
    // }

    // else {
    // if (playerClass == WARRIOR && content_service.IsTheRuinsOfKunarkEnabled()) {
    // 	softcap = 405;
    // }
    // }
    if (playerClass === Classes.Warrior) {
      softcap = 405;
    }
  }

  // Combat Stability AA - this raises the softcap
  softcap += Math.floor((combat_stability_percent * softcap) / 100);

  // if (content_service.IsTheShadowsOfLuclinEnabled()) {
  // 	// shield AC is not capped in Luclin
  // 	softcap += shield_ac;
  // }

  if (!ignoreCap && acSum > softcap) {
    if (level <= 50) {
      return softcap; // it's hard <= level 50
    }

    // if (!content_service.IsTheShadowsOfLuclinEnabled()) {
    return softcap;
    // }

    // let overcap = acSum - softcap;
    // let returns = 20;

    // if (!content_service.IsThePlanesOfPowerEnabled()) {
    // 	return 12;
    // 	if (playerClass == CLERIC || playerClass == DRUID || playerClass == SHAMAN || playerClass == WIZARD || playerClass == MAGICIAN || playerClass == ENCHANTER || playerClass == NECROMANCER) {
    // 		overcap = 0; // melee only until PoP
    // 	}
    // }
    // else {
    // 	if (playerClass == WARRIOR) {
    // 		if (level <= 61) {
    // 			returns = 5;
    // 		}
    // 		else if (level <= 63) {
    // 			returns = 4;
    // 		}
    // 		else {
    // 			returns = 3;
    // 		}
    // 	}
    // 	else if (playerClass == PALADIN || playerClass == SHADOWKNIGHT) {
    // 		if (level <= 61) {
    // 			returns = 6;
    // 		}
    // 		else if (level <= 63) {
    // 			returns = 5;
    // 		}
    // 		else {
    // 			returns = 4;
    // 		}
    // 	}
    // 	else if (playerClass == BARD) {
    // 		if (level <= 61) {
    // 			returns = 8;
    // 		}
    // 		else if (level <= 63) {
    // 			returns = 7;
    // 		}
    // 		else {
    // 			returns = 6;
    // 		}
    // 	}
    // 	else if (playerClass == MONK || playerClass == ROGUE) {
    // 		if (level <= 61) {
    // 			returns = 20;
    // 		}
    // 		else if (level == 62) {
    // 			returns = 18;
    // 		}
    // 		else if (level == 63) {
    // 			returns = 16;
    // 		}
    // 		else if (level == 64) {
    // 			returns = 14;
    // 		}
    // 		else {
    // 			returns = 12;
    // 		}
    // 	}
    // 	else if (playerClass == RANGER || playerClass == BEASTLORD)	{
    // 		if (level <= 61) {
    // 			returns = 10;
    // 		}
    // 		else if (level == 62) {
    // 			returns = 9;
    // 		}
    // 		else if (level == 63) {
    // 			returns = 8;
    // 		}
    // 		else {
    // 			returns = 7;
    // 		}
    // 	}
    // }
    // acSum = softcap + overcap / returns;
  }
  return acSum;
};

const isWarriorClass = (classId: number) => {
  switch (classId) {
    case Classes.Warrior:
    case Classes.WarriorGM:
    case Classes.Rogue:
    case Classes.RogueGM:
    case Classes.Monk:
    case Classes.MonkGM:
    case Classes.Paladin:
    case Classes.PaladinGM:
    case Classes.ShadowKnight:
    case Classes.ShadowKnightGM:
    case Classes.Ranger:
    case Classes.RangerGM:
    case Classes.Beastlord:
    case Classes.BeastlordGM:
    case Classes.Bard:
    case Classes.BardGM: {
      return true;
    }
    default: {
      return false;
    }
  }
};

// the output of this function is precise and is based on the code from:
// https://forums.daybreakgames.com/eq/index.php?threads/progression-monks-we-have-work-to-do.229581/
const clientRollDamageMultiplier = (
  character: Character,
  offense: number,
  damage: number,
  skill: number
) => {
  let rollChance = 51;
  let maxExtra = 210;
  let minusFactor = 105;

  const { classId, level } = character;

  if (classId == Classes.Monk && level >= 65) {
    rollChance = 83;
    maxExtra = 300;
    minusFactor = 50;
  } else if (level >= 65 || (classId == Classes.Monk && level >= 63)) {
    rollChance = 81;
    maxExtra = 295;
    minusFactor = 55;
  } else if (level >= 63 || (classId == Classes.Monk && level >= 60)) {
    rollChance = 79;
    maxExtra = 290;
    minusFactor = 60;
  } else if (level >= 60 || (classId == Classes.Monk && level >= 56)) {
    rollChance = 77;
    maxExtra = 285;
    minusFactor = 65;
  } else if (level >= 56) {
    rollChance = 72;
    maxExtra = 265;
    minusFactor = 70;
  } else if (level >= 51 || classId == Classes.Monk) {
    rollChance = 65;
    maxExtra = 245;
    minusFactor = 80;
  }

  let baseBonus = Math.round((Math.round(offense) - minusFactor) / 2);
  if (baseBonus < 10) baseBonus = 10;

  if (rollInt(rollChance)) {
    let roll;

    roll = int(0, baseBonus) + 100;
    if (roll > maxExtra) roll = maxExtra;

    damage = (damage * roll) / 100;

    if (
      level >= 55 &&
      damage > 1 &&
      skill != Skills.Archery &&
      isWarriorClass(character.classId)
    )
      damage++;

    return { damage, roll };
  } else {
    return { damage, roll: 100 };
  }
};

const tryCriticalHit = (
  attacker: Character,
  defender: Character,
  skill: number,
  damage: number,
  minBase: number,
  damageBonus: number
) => {
  if (damage < 1) return damage;
  if (damageBonus > damage)
    // damage should include the bonus already, but calcs need the non-bonus portion
    damageBonus = damage;

  let critChance = 0.0;
  let isBerserk = false;
  let undeadTarget = false;

  //1: Try Slay Undead
  // if (defender && (defender->GetBodyType() == BT_Undead ||
  // 	defender->GetBodyType() == BT_SummonedUndead || defender->GetBodyType() == BT_Vampire))
  // {
  // 	undeadTarget = true;

  // 	// these were added together in a december 2004 patch.  before then it was probably this, but not 100% sure
  // 	int32 SlayRateBonus = std::max(aabonuses.SlayUndead[0], spellbonuses.SlayUndead[0]);

  // 	if (SlayRateBonus)
  // 	{
  // 		float slayChance = static_cast<float>(SlayRateBonus) / 10000.0f;
  // 		if (zone->random.Roll(slayChance))
  // 		{
  // 			int32 slayDmgBonus = std::max(aabonuses.SlayUndead[1], spellbonuses.SlayUndead[1]);
  // 			damage = ((damage - damageBonus + 6) * slayDmgBonus) / 100 + damageBonus;

  // 			int minSlay = (minBase + 5) * slayDmgBonus / 100 + damageBonus;
  // 			if (damage < minSlay)
  // 				damage = minSlay;

  // 			if (GetGender() == 1) // female
  // 				entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
  // 					Chat::MeleeCrit, FilterMeleeCrits, FEMALE_SLAYUNDEAD,
  // 					GetCleanName(), itoa(damage));
  // 			else // males and neuter I guess
  // 				entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
  // 					Chat::MeleeCrit, FilterMeleeCrits, MALE_SLAYUNDEAD,
  // 					GetCleanName(), itoa(damage));
  // 			return;
  // 		}
  // 	}
  // }

  //2: Try Melee Critical
  if (attacker.isClient) {
    // Combat Fury and Fury of the Ages AAs
    let critChanceMult = 0; //aabonuses.CriticalHitChance;

    // critChance += RuleI(Combat, ClientBaseCritChance); // 0 on quarm
    let overCap = 0.0;
    if (attacker.stats.dex > 255) overCap = (attacker.stats.dex - 255) / 400;

    // not used in anything, but leaving for custom servers I guess
    // if (spellbonuses.BerserkSPA || itembonuses.BerserkSPA || aabonuses.BerserkSPA)
    // 	isBerserk = true;

    if (attacker.classId == Classes.Warrior && attacker.level >= 12) {
      // if (IsBerserk())
      // 	isBerserk = true;

      critChance += 0.5 + attacker.stats.dex / 90 + overCap;
    } else if (
      skill == Skills.Archery &&
      attacker.classId == Classes.Ranger &&
      attacker.level > 16
    ) {
      critChance += 1.35 + attacker.stats.dex / 34.0 + overCap * 2;
    } else if (attacker.classId != Classes.Warrior && critChanceMult) {
      critChance += 0.275 + attacker.stats.dex / 150.0 + overCap;
    }

    if (critChanceMult) critChance += (critChance * critChanceMult) / 100.0;

    // this is cleaner hardcoded due to the way bonuses work and holyforge crit rate is a max()
    // uint8 activeDisc = CastToClient()->GetActiveDisc();

    // if (activeDisc == disc_defensive)
    // 	critChance = 0.0f;
    // else if (activeDisc == disc_mightystrike)
    // 	critChance = 100.0f;
    // else if (activeDisc == disc_holyforge && undeadTarget && critChance < (spellbonuses.CriticalHitChance / 100.0f))
    // 	critChance = static_cast<float>(spellbonuses.CriticalHitChance) / 100.0f;
  }

  let deadlyChance = 0;
  let deadlyMod = 0;

  if (
    skill == Skills.Throwing &&
    attacker.classId == Classes.Rogue &&
    attacker.maxSkills[Skills.Throwing] >= 65
  ) {
    critChance += 25; // RuleI(Combat, RogueCritThrowingChance);
    deadlyChance = 80; //RuleI(Combat, RogueDeadlyStrikeChance);
    deadlyMod = 2; // RuleI(Combat, RogueDeadlyStrikeMod);
  }

  if (critChance > 0) {
    critChance /= 100;

    if (rollInt(critChance)) {
      let critMod = 17;
      let crip_success = false;
      let cripplingBlowChance = 0; //spellbonuses.CrippBlowChance;		// Holyforge Discipline
      let minDamage = 0;

      if (cripplingBlowChance || isBerserk) {
        if (
          isBerserk ||
          (cripplingBlowChance && rollInt(cripplingBlowChance))
        ) {
          critMod = 29;
          crip_success = true;
        }
      }

      if (minBase) minDamage = (minBase * critMod + 5) / 10 + 8 + damageBonus;

      damage = ((damage - damageBonus) * critMod + 5) / 10 + 8 + damageBonus;
      if (crip_success) {
        damage += 2;
        minDamage += 2;
      }
      if (minBase && minDamage > damage) damage = minDamage;

      let deadlySuccess = false;
      if (deadlyChance && rollDecimal(deadlyChance / 100.0)) {
        // if (BehindMob(defender, GetX(), GetY())) // we'll just assume we're behind for rogues
        // {
        damage *= deadlyMod;
        deadlySuccess = true;
        // }
      }

      // sanity check; 1 damage crits = an error somewhere
      if (damage > 1000000 || damage < 0) damage = 1;

      // if (crip_success)
      // {
      // 	entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
      // 			Chat::MeleeCrit, FilterMeleeCrits, CRIPPLING_BLOW,
      // 			GetCleanName(), itoa(damage));
      // 	// Crippling blows also have a chance to stun
      // 	//Kayen: Crippling Blow would cause a chance to interrupt for npcs < 55, with a staggers message.
      // 	if (defender != nullptr && defender->GetLevel() <= 55 && !defender->GetSpecialAbility(IMMUNE_STUN) && zone->random.Roll(85))
      // 	{
      // 		defender->Emote("staggers.");
      // 		defender->Stun(0, this);
      // 	}
      // }
      // else if (deadlySuccess)
      // {
      // 	entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
      // 			Chat::MeleeCrit, FilterMeleeCrits, DEADLY_STRIKE,
      // 			GetCleanName(), itoa(damage));
      // }
      // else
      // {
      // 	entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
      // 			Chat::MeleeCrit, FilterMeleeCrits, CRITICAL_HIT,
      // 			GetCleanName(), itoa(damage));
      // }
    }
  }

  // Discs
  // if (defender && IsClient() && CastToClient()->HasInstantDisc(skill))
  // {
  // 	if (damage > 0)
  // 	{
  // 		if (skill == EQ::skills::SkillFlyingKick)
  // 		{
  // 			entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
  // 				Chat::MeleeCrit, FilterMeleeCrits, THUNDEROUS_KICK,
  // 				GetName(), itoa(damage));
  // 		}
  // 		else if (skill == EQ::skills::SkillEagleStrike)
  // 		{
  // 			entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
  // 				Chat::MeleeCrit, FilterMeleeCrits, ASHEN_CRIT,
  // 				GetName(), defender->GetCleanName());
  // 		}
  // 		else if (skill == EQ::skills::SkillDragonPunch)
  // 		{
  // 			uint32 stringid = SILENT_FIST_CRIT;
  // 			if (GetRace() == IKSAR)
  // 			{
  // 				stringid = SILENT_FIST_TAIL;
  // 			}

  // 			entity_list.FilteredMessageClose_StringID(this, false, RuleI(Range, CombatSpecials),
  // 				Chat::MeleeCrit, FilterMeleeCrits, stringid,
  // 				GetName(), defender->GetCleanName());
  // 		}
  // 	}

  // 	if (damage != DMG_MISS)
  // 	{
  // 		CastToClient()->FadeDisc();
  // 	}
  // }
  return damage;
};

export const checkDualWield = (character: Character) => {
  if (getDualWieldChance(character, true) > int(0, 374))
    // 1% per 3.75 skill
    return true;

  return false;
};

// returns either chance in %, or the effective skill level which is essentially chance% * 3.75
// combat rolls should use the latter for accuracy.  Sony rolls against 375
export const getDualWieldChance = (
  character: Character,
  returnEffectiveSkill: boolean
) => {
  let chance = character.maxSkills[Skills.DualWield]; // 245 or 252
  if (chance > 0) {
    if (character.isClient) chance += character.level;
    else if (character.level > 35) chance += character.level;
  }

  // chance += aabonuses.Ambidexterity; // 32

  // SE_DualWieldChance[176] - Deftdance and Kinesthetics Disciplines
  // chance += spellbonuses.DualWieldChance;

  if (returnEffectiveSkill) return chance;
  else return (chance * 100) / 375;
};

// returns either chance in %, or the effective skill level which is essentially chance% * 5
// combat rolls should use the latter for accuracy.  Sony rolls against 500
export const getDoubleAttackChance = (
  character: Character,
  returnEffectiveSkill: boolean
) => {
  let chance = character.maxSkills[Skills.DoubleAttack];

  if (chance > 0) {
    if (character.isClient) chance += character.level;
    else if (character.level > 35) chance += character.level;
  }

  // Bestial Frenzy/Harmonious Attack AA - grants double attacks for classes that otherwise do not get the skill
  // if (aabonuses.GiveDoubleAttack)
  // 	chance += aabonuses.GiveDoubleAttack * 5;

  // Knight's Advantage and Ferocity AAs; Double attack rate is 67% at 245 skill with Ferocity, so this is the only way it can be
  // if (aabonuses.DoubleAttackChance)
  // 	chance += chance * aabonuses.DoubleAttackChance / 100;

  if (returnEffectiveSkill) return chance;
  else return chance / 5;
};

export const checkDoubleAttack = (character: Character) => {
  if (getDoubleAttackChance(character, true) > int(0, 499))
    // 1% per 5 skill
    return true;

  return false;
};


// const getProcChance = (character: Character, hand: number) =>
// {
// 	let chance = 0.0;
// 	let weapon_speed = getWeaponSpeedbyHand(hand);
// 	weapon_speed /= 100.0;

// 	let dex = character.stats.dex;
// 	if (dex > 255.0)
// 		dex = 255.0;		// proc chance caps at 255
	
// 	/* Kind of ugly, but results are very accurate
// 	   Proc chance is a linear function based on dexterity
// 	   0.0004166667 == base proc chance at 1 delay with 0 dex (~0.25 PPM for main hand)
// 	   1.1437908496732e-5 == chance increase per point of dex at 1 delay
// 	   Result is 0.25 PPM at 0 dex, 2 PPM at 255 dex
// 	*/
// 	chance = ((0.0004166667 + 1.1437908496732e-5 * dex) * weapon_speed);

// 	if (hand == Slots.Secondary)
// 	{
// 		chance *= 50.0 / getDualWieldChance(character, false);
// 	}								
	
// 	return chance;
// }