import { Classes } from '../../api/classes';
import { ItemTypes } from '../../api/items';
import { PlayableRaces } from '../../api/race';
import { Slots } from '../../api/slots';
import { Item } from '../../items/item.entity';
import { isEquippable } from './quarm.attack';
import { Character, getDefaultStats, Stats } from './quarm.character';

// Calc MR, PR, DR, FR, CR totally should go under the Character class.
// Buuut they're fucking huge functions, so I'm splitting it out to here.

const MAX_STAT = 250;
const MAX_RESIST = 500;

export const calcMR = (character: Character) => {
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

  calc +=
    character.itemBonuses.mr +
    character.aaBonuses.mr +
    character.spellBonuses.mr;
  // if (includeSpells)
  // {
  // 	calc += spellbonuses.MR;
  // }

  if (character.classId == Classes.Warrior) calc += character.level / 2;

  if (calc < 1) calc = 1;

  // if(!ignoreCap)
  // {
  if (calc > MAX_RESIST) calc = MAX_RESIST;
  // }

  return calc;
};

export const calcFR = (character: Character) => {
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

  const c = character.classId;
  if (c == Classes.Ranger) {
    calc += 4;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Monk) {
    calc += 8;

    const l = character.level;
    if (l > 49) calc += l - 49;
  }

  calc +=
    character.itemBonuses.fr +
    character.aaBonuses.fr +
    character.spellBonuses.fr;
  // if (includeSpells)
  // {
  // calc += spellbonuses.FR;
  // }

  if (calc < 1) calc = 1;

  // if(!ignoreCap)
  // {
  if (calc > MAX_RESIST) calc = MAX_RESIST;
  // }

  return calc;
};

export const calcDR = (character: Character) => {
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

  const c = character.classId;
  if (c == Classes.Paladin) {
    calc += 8;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.ShadowKnight) {
    calc += 4;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Beastlord) {
    calc += 4;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Monk) {
    const l = character.level;
    if (l > 50) calc += l - 50;
  }

  calc +=
    character.itemBonuses.dr +
    character.aaBonuses.dr +
    character.spellBonuses.dr;
  // if (includeSpells)
  // {
  // 	calc += spellbonuses.DR;
  // }

  if (calc < 1) calc = 1;

  // if(!ignoreCap)
  // {
  if (calc > MAX_RESIST) calc = MAX_RESIST;
  // }

  return calc;
};

export const calcPR = (character: Character) => {
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

  const c = character.classId;
  if (c == Classes.Rogue) {
    calc += 8;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.ShadowKnight) {
    calc += 4;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Monk) {
    const l = character.level;
    if (l > 50) calc += l - 50;
  }

  calc +=
    character.itemBonuses.pr +
    character.aaBonuses.pr +
    character.spellBonuses.pr;
  // if (includeSpells)
  // {
  // 	calc += spellbonuses.PR;
  // }

  if (calc < 1) calc = 1;

  // if(!ignoreCap)
  // {
  if (calc > MAX_RESIST) calc = MAX_RESIST;
  // }

  return calc;
};

export const calcCR = (character: Character) => {
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

  const c = character.classId;
  if (c == Classes.Ranger) {
    calc += 4;

    const l = character.level;
    if (l > 49) calc += l - 49;
  } else if (c == Classes.Beastlord) {
    calc += 4;

    const l = character.level;
    if (l > 49) calc += l - 49;
  }

  calc +=
    character.itemBonuses.cr +
    character.aaBonuses.cr +
    character.spellBonuses.cr;
  // if (includeSpells)
  // {
  // 	calc += spellbonuses.CR;
  // }

  if (calc < 1) calc = 1;

  // if(!ignoreCap)
  // {
  if (calc > MAX_RESIST) calc = MAX_RESIST;
  // }

  return calc;
};

export const calcStat = (
  character: Character,
  statFunc: (stats: Stats) => number
) => {
  let val =
    statFunc(character.baseStats) +
    statFunc(character.itemBonuses) +
    statFunc(character.spellBonuses); // + CalcAlcoholPhysicalEffect() - CalculateFatiguePenalty();

  if (character.allocatedStats) {
    val += statFunc(character.allocatedStats);
  }

  // TOOD:  probably care about berserk at some point
  // if (CalcAlcoholPhysicalEffect() == 0 && GetClass() == WARRIOR && IsBerserk())
  // {
  // 	val += GetLevel() / 10 + 9;
  // }

  const mod = statFunc(character.aaBonuses);
  let STAT = val + mod;

  if (STAT < 1) STAT = 1;

  const m = MAX_STAT;
  if (STAT > m) STAT = m;

  return STAT;
};

export const calcItemBonuses = (character: Character) => {
  //memset assumed to be done by caller.

  // Clear item faction mods
  // ClearItemFactionBonuses();
  // ShieldEquiped(false);
  // SetBashEnablingWeapon(false);

  const itemsWithBonuses = character.slots
    .filter((s) => !s.slotIds.includes(Slots.Ammo) && s.item)
    .map((s) => s.item);
  character.itemBonuses = getDefaultStats();
  for (const item of itemsWithBonuses) {
    addItemBonuses(character, item as Item);
  }

  // unsigned int i;
  // //should not include 21 (SLOT_AMMO)
  // for (i = EQ::invslot::slotEar1; i < EQ::invslot::slotAmmo; i++) {
  // 	const EQ::ItemInstance* inst = m_inv[i];
  // 	if(inst == 0)
  // 		continue;
  // 	AddItemBonuses(inst, newbon);

  //Check if item in secondary slot is a 'shield'. Required for multiple spell effects.
  // if (i == EQ::invslot::slotSecondary && (m_inv.GetItem(EQ::invslot::slotSecondary)->GetItem()->ItemType == EQ::item::ItemTypeShield))
  // 	ShieldEquiped(true);

  // // Fiery Avenger, Fiery Defender, Innuruuk's Curse
  // if (i == EQ::invslot::slotPrimary && (m_inv.GetItem(EQ::invslot::slotPrimary)->GetID() == 11050 || m_inv.GetItem(EQ::invslot::slotPrimary)->GetID() == 10099 || m_inv.GetItem(EQ::invslot::slotPrimary)->GetID() == 14383))
  // 	SetBashEnablingWeapon(true);

  // if (GetAA(aa2HandBash) && i == EQ::invslot::slotPrimary && (m_inv.GetItem(EQ::invslot::slotPrimary)->GetItem()->ItemType == EQ::item::ItemType2HSlash
  // 	|| m_inv.GetItem(EQ::invslot::slotPrimary)->GetItem()->ItemType == EQ::item::ItemType2HBlunt
  // 	|| m_inv.GetItem(EQ::invslot::slotPrimary)->GetItem()->ItemType == EQ::item::ItemType2HPiercing)
  // )
  // 	SetBashEnablingWeapon(true);
  // }

  // Caps
  // TODO:  Probably need to care about this attack cap eventually.
  // newbon->ATKUncapped = newbon->ATK;
  // if (newbon->ATK > RuleI(Character, ItemATKCap))
  // 	newbon->ATK = RuleI(Character, ItemATKCap);

  // newbon->HPRegenUncapped = newbon->HPRegen;
  // if(newbon->HPRegen > CalcHPRegenCap())
  // 	newbon->HPRegen = CalcHPRegenCap();

  // newbon->ManaRegenUncapped = newbon->ManaRegen;
  // if(newbon->ManaRegen > CalcManaRegenCap())
  // 	newbon->ManaRegen = CalcManaRegenCap();
};

const ItemATKCap = 250;

const addItemBonuses = (character: Character, item: Item) => {
  if (!item || item.itemclass !== 0) {
    // common item class
    return;
  }

  const isEquipable = isEquippable(item, character);
  if (!isEquipable) {
    if (item.itemtype === ItemTypes.Food || item.itemtype === ItemTypes.Drink) {
      console.log('is food or drink');
      return;
    }
  }

  // The client always applies bonuses if the item is equipped, so skip this check for devels who deleved themselves in testing.
  // if(GetLevel() < item->ReqLevel && Admin() < 80) {
  // 	return;
  // }

  if (character.level >= item.reclevel) {
    character.itemBonuses.ac += item.ac;
    character.itemBonuses.hp += item.hp;
    character.itemBonuses.mana += item.mana;
    character.itemBonuses.str += item.astr;
    character.itemBonuses.sta += item.asta;
    character.itemBonuses.dex += item.adex;
    character.itemBonuses.agi += item.aagi;
    character.itemBonuses.int += item.aint;
    character.itemBonuses.wis += item.awis;
    character.itemBonuses.cha += item.acha;
    character.itemBonuses.mr += item.mr;
    character.itemBonuses.fr += item.fr;
    character.itemBonuses.cr += item.cr;
    character.itemBonuses.pr += item.pr;
    character.itemBonuses.dr += item.dr;
  } else {
    const lvl = character.level;
    const reclvl = item.reclevel;

    character.itemBonuses.ac += calcRecommendedLevelBonus(lvl, reclvl, item.ac);
    character.itemBonuses.hp += calcRecommendedLevelBonus(lvl, reclvl, item.hp);
    character.itemBonuses.mana += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.mana
    );
    character.itemBonuses.str += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.astr
    );
    character.itemBonuses.sta += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.asta
    );
    character.itemBonuses.dex += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.adex
    );
    character.itemBonuses.agi += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.aagi
    );
    character.itemBonuses.int += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.aint
    );
    character.itemBonuses.wis += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.awis
    );
    character.itemBonuses.cha += calcRecommendedLevelBonus(
      lvl,
      reclvl,
      item.acha
    );

    character.itemBonuses.mr += calcRecommendedLevelBonus(lvl, reclvl, item.mr);
    character.itemBonuses.fr += calcRecommendedLevelBonus(lvl, reclvl, item.fr);
    character.itemBonuses.cr += calcRecommendedLevelBonus(lvl, reclvl, item.cr);
    character.itemBonuses.pr += calcRecommendedLevelBonus(lvl, reclvl, item.pr);
    character.itemBonuses.dr += calcRecommendedLevelBonus(lvl, reclvl, item.dr);
  }

  //FatherNitwit: New style haste, shields, and regens
  //solar: some OLDPEQ items in the TAKP db have worn effect in the proc effect field, this is also fixed up in mac.cpp so the client sees them correctly
  // if ((item->Worn.Effect>0 || item->Proc.Effect>0) && (item->Worn.Type == EQ::item::ItemEffectWorn)) { // latent effects
  // 	ApplySpellsBonuses(item->Worn.Effect ? item->Worn.Effect : item->Proc.Effect, item->Worn.Level > 0 ? item->Worn.Level : GetLevel(), newbon, 0, true);
  // }

  // if (item->Focus.Effect>0 && (item->Focus.Type == EQ::item::ItemEffectFocus) && content_service.IsTheShadowsOfLuclinEnabled()) { // focus effects
  // 	ApplySpellsBonuses(item->Focus.Effect, GetLevel(), newbon, 0, true);
  // }

  // switch(item->BardType) {
  // case 51: /* All (e.g. Singing Short Sword) */
  // 	{
  // 		if(item->BardValue > newbon->singingMod)
  // 			newbon->singingMod = item->BardValue;
  // 		if(item->BardValue > newbon->brassMod)
  // 			newbon->brassMod = item->BardValue;
  // 		if(item->BardValue > newbon->stringedMod)
  // 			newbon->stringedMod = item->BardValue;
  // 		if(item->BardValue > newbon->percussionMod)
  // 			newbon->percussionMod = item->BardValue;
  // 		if(item->BardValue > newbon->windMod)
  // 			newbon->windMod = item->BardValue;
  // 		break;
  // 	}
  // case 50: /* Singing */
  // 	{
  // 		if(item->BardValue > newbon->singingMod)
  // 			newbon->singingMod = item->BardValue;
  // 		break;
  // 	}
  // case 23: /* Wind */
  // 	{
  // 		if(item->BardValue > newbon->windMod)
  // 			newbon->windMod = item->BardValue;
  // 		break;
  // 	}
  // case 24: /* stringed */
  // 	{
  // 		if(item->BardValue > newbon->stringedMod)
  // 			newbon->stringedMod = item->BardValue;
  // 		break;
  // 	}
  // case 25: /* brass */
  // 	{
  // 		if(item->BardValue > newbon->brassMod)
  // 			newbon->brassMod = item->BardValue;
  // 		break;
  // 	}
  // case 26: /* Percussion */
  // 	{
  // 		if(item->BardValue > newbon->percussionMod)
  // 			newbon->percussionMod = item->BardValue;
  // 		break;
  // 	}
  // }

  // if (item->SkillModValue != 0 && item->SkillModType <= EQ::skills::HIGHEST_SKILL){
  // 	if ((item->SkillModValue > 0 && newbon->skillmod[item->SkillModType] < item->SkillModValue) ||
  // 		(item->SkillModValue < 0 && newbon->skillmod[item->SkillModType] > item->SkillModValue))
  // 	{
  // 		newbon->skillmod[item->SkillModType] = item->SkillModValue;
  // 	}
  // }

  // // Add Item Faction Mods
  // if (item->FactionMod1)
  // {
  // 	if (item->FactionAmt1 > 0 && item->FactionAmt1 > GetItemFactionBonus(item->FactionMod1))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod1, item->FactionAmt1);
  // 	}
  // 	else if (item->FactionAmt1 < 0 && item->FactionAmt1 < GetItemFactionBonus(item->FactionMod1))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod1, item->FactionAmt1);
  // 	}
  // }
  // if (item->FactionMod2)
  // {
  // 	if (item->FactionAmt2 > 0 && item->FactionAmt2 > GetItemFactionBonus(item->FactionMod2))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod2, item->FactionAmt2);
  // 	}
  // 	else if (item->FactionAmt2 < 0 && item->FactionAmt2 < GetItemFactionBonus(item->FactionMod2))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod2, item->FactionAmt2);
  // 	}
  // }
  // if (item->FactionMod3)
  // {
  // 	if (item->FactionAmt3 > 0 && item->FactionAmt3 > GetItemFactionBonus(item->FactionMod3))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod3, item->FactionAmt3);
  // 	}
  // 	else if (item->FactionAmt3 < 0 && item->FactionAmt3 < GetItemFactionBonus(item->FactionMod3))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod3, item->FactionAmt3);
  // 	}
  // }
  // if (item->FactionMod4)
  // {
  // 	if (item->FactionAmt4 > 0 && item->FactionAmt4 > GetItemFactionBonus(item->FactionMod4))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod4, item->FactionAmt4);
  // 	}
  // 	else if (item->FactionAmt4 < 0 && item->FactionAmt4 < GetItemFactionBonus(item->FactionMod4))
  // 	{
  // 		AddItemFactionBonus(item->FactionMod4, item->FactionAmt4);
  // 	}
  // }
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
      return Math.floor(statmod / 10000);
    } else {
      statmod += 5000;
      return Math.floor(statmod / 10000);
    }
  }

  return 0;
};
