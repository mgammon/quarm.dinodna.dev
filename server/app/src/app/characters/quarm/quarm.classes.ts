import { Classes } from '../../api/classes';
import { PlayableRaces } from '../../api/race';

// [str,sta,agy,dex,wis,int,cha,bonus]
export const baseStats: Record<number, Record<number, number[]>> = {
  [Classes.Warrior]: {
    [PlayableRaces.Barbarian]: [113, 105, 87, 70, 70, 60, 55, 25],
    [PlayableRaces.DarkElf]: [70, 75, 90, 75, 83, 99, 60, 25],
    [PlayableRaces.Dwarf]: [100, 100, 75, 90, 83, 60, 45, 25],
    [PlayableRaces.Gnome]: [70, 80, 90, 85, 67, 98, 60, 25],
    [PlayableRaces.HalfElf]: [80, 80, 95, 85, 60, 75, 75, 25],
    [PlayableRaces.Halfling]: [80, 85, 100, 90, 80, 67, 50, 25],
    [PlayableRaces.Human]: [85, 85, 80, 75, 75, 75, 75, 25],
    [PlayableRaces.Iksar]: [80, 80, 95, 85, 80, 75, 55, 25],
    [PlayableRaces.Ogre]: [140, 132, 75, 70, 67, 60, 37, 25],
    [PlayableRaces.Troll]: [118, 119, 88, 75, 60, 52, 40, 25],
    [PlayableRaces.WoodElf]: [75, 75, 100, 80, 80, 75, 75, 25],
  },
  [Classes.Wizard]: {
    [PlayableRaces.DarkElf]: [60, 75, 90, 75, 83, 109, 60, 30],
    [PlayableRaces.Erudite]: [60, 80, 70, 70, 83, 117, 70, 30],
    [PlayableRaces.Gnome]: [60, 80, 85, 85, 67, 108, 60, 30],
    [PlayableRaces.HighElf]: [55, 75, 85, 70, 95, 102, 80, 30],
    [PlayableRaces.Human]: [75, 85, 75, 75, 75, 85, 75, 30],
  },
  [Classes.Necromancer]: {
    [PlayableRaces.DarkElf]: [60, 65, 90, 85, 83, 109, 60, 30],
    [PlayableRaces.Erudite]: [60, 70, 70, 80, 83, 117, 70, 30],
    [PlayableRaces.Gnome]: [60, 70, 85, 95, 67, 108, 60, 30],
    [PlayableRaces.Human]: [75, 75, 75, 85, 75, 85, 75, 30],
    [PlayableRaces.Iksar]: [70, 70, 90, 95, 80, 85, 55, 30],
  },
  [Classes.Magician]: {
    [PlayableRaces.DarkElf]: [60, 75, 90, 75, 83, 109, 60, 30],
    [PlayableRaces.Erudite]: [60, 80, 70, 70, 83, 117, 70, 30],
    [PlayableRaces.Gnome]: [60, 80, 85, 85, 67, 108, 60, 30],
    [PlayableRaces.HighElf]: [55, 75, 85, 70, 95, 102, 80, 30],
    [PlayableRaces.Human]: [75, 85, 75, 75, 75, 85, 75, 30],
  },
  [Classes.Enchanter]: {
    [PlayableRaces.DarkElf]: [60, 65, 90, 75, 83, 109, 70, 30],
    [PlayableRaces.Erudite]: [60, 70, 70, 70, 83, 117, 80, 30],
    [PlayableRaces.Gnome]: [60, 70, 85, 85, 67, 108, 70, 30],
    [PlayableRaces.HighElf]: [55, 65, 85, 70, 95, 102, 90, 30],
    [PlayableRaces.Human]: [75, 75, 75, 75, 75, 85, 85, 30],
  },
  [Classes.Shaman]: {
    [PlayableRaces.Barbarian]: [103, 100, 82, 70, 80, 60, 60, 30],
    [PlayableRaces.Iksar]: [70, 75, 90, 85, 90, 75, 60, 30],
    [PlayableRaces.Ogre]: [130, 127, 70, 70, 77, 60, 42, 30],
    [PlayableRaces.Troll]: [108, 114, 83, 75, 70, 52, 45, 30],
  },
  [Classes.Druid]: {
    [PlayableRaces.WoodElf]: [65, 75, 95, 80, 90, 75, 75, 30],
    [PlayableRaces.HalfElf]: [70, 80, 90, 85, 70, 75, 75, 30],
    [PlayableRaces.Halfling]: [70, 85, 95, 90, 90, 67, 50, 30],
    [PlayableRaces.Human]: [75, 85, 75, 75, 85, 75, 75, 30],
  },
  [Classes.Ranger]: {
    [PlayableRaces.HalfElf]: [75, 80, 100, 85, 65, 75, 75, 20],
    [PlayableRaces.Human]: [80, 85, 85, 75, 80, 75, 75, 20],
    [PlayableRaces.WoodElf]: [70, 75, 105, 80, 85, 75, 75, 20],
  },
  [Classes.Bard]: {
    [PlayableRaces.WoodElf]: [70, 65, 95, 90, 80, 75, 85, 25],
    [PlayableRaces.HalfElf]: [75, 70, 90, 95, 60, 75, 85, 25],
    [PlayableRaces.Human]: [80, 75, 75, 85, 75, 75, 85, 25],
  },
  [Classes.Cleric]: {
    [PlayableRaces.DarkElf]: [65, 70, 90, 75, 93, 99, 60, 30],
    [PlayableRaces.Dwarf]: [95, 95, 70, 90, 93, 60, 45, 30],
    [PlayableRaces.Erudite]: [65, 75, 70, 70, 93, 107, 70, 30],
    [PlayableRaces.Gnome]: [65, 75, 85, 85, 77, 98, 60, 30],
    [PlayableRaces.Halfling]: [75, 80, 95, 90, 90, 67, 50, 30],
    [PlayableRaces.HighElf]: [60, 70, 85, 70, 105, 92, 80, 30],
    [PlayableRaces.Human]: [80, 80, 75, 75, 85, 75, 75, 30],
  },
  [Classes.Paladin]: {
    [PlayableRaces.Dwarf]: [100, 95, 70, 90, 88, 60, 55, 20],
    [PlayableRaces.Erudite]: [70, 75, 70, 70, 88, 107, 80, 20],
    [PlayableRaces.HalfElf]: [80, 75, 90, 85, 65, 75, 85, 20],
    [PlayableRaces.HighElf]: [65, 70, 85, 70, 100, 92, 90, 20],
    [PlayableRaces.Human]: [85, 80, 75, 75, 80, 75, 85, 20],
  },
  [Classes.Monk]: {
    [PlayableRaces.Human]: [80, 80, 85, 85, 75, 75, 75, 20],
    [PlayableRaces.Iksar]: [75, 75, 100, 95, 80, 75, 55, 20],
  },
  [Classes.Rogue]: {
    [PlayableRaces.Barbarian]: [103, 95, 92, 80, 70, 60, 55, 30],
    [PlayableRaces.DarkElf]: [60, 65, 100, 85, 83, 99, 60, 30],
    [PlayableRaces.Dwarf]: [90, 90, 80, 100, 83, 60, 45, 30],
    [PlayableRaces.Gnome]: [60, 70, 95, 95, 67, 98, 60, 30],
    [PlayableRaces.HalfElf]: [70, 70, 100, 95, 60, 75, 75, 30],
    [PlayableRaces.Halfling]: [70, 75, 105, 100, 80, 67, 50, 30],
    [PlayableRaces.Human]: [75, 75, 85, 85, 75, 75, 75, 30],
    [PlayableRaces.WoodElf]: [65, 65, 105, 90, 80, 75, 75, 30],
  },
  [Classes.ShadowKnight]: {
    [PlayableRaces.DarkElf]: [70, 70, 90, 75, 83, 109, 65, 20],
    [PlayableRaces.Erudite]: [70, 75, 70, 70, 83, 117, 75, 20],
    [PlayableRaces.Human]: [85, 80, 75, 75, 75, 85, 80, 20],
    [PlayableRaces.Iksar]: [80, 75, 90, 85, 80, 85, 60, 20],
    [PlayableRaces.Ogre]: [140, 127, 70, 70, 67, 70, 42, 20],
    [PlayableRaces.Troll]: [118, 114, 83, 75, 60, 62, 45, 20],
  },
};

const getClassIDName = (class_id: number, level: number) => {
  switch (class_id) {
    case Classes.Warrior:
      if (level >= 65)
        return 'Overlord'; //Baron-Sprite: LEAVE MY CLASSES ALONE.
      else if (level >= 60) return 'Warlord';
      else if (level >= 55) return 'Myrmidon';
      else if (level >= 51) return 'Champion';
      else return 'Warrior';
    case Classes.Cleric:
      if (level >= 65) return 'Archon';
      else if (level >= 60) return 'High Priest';
      else if (level >= 55) return 'Templar';
      else if (level >= 51) return 'Vicar';
      else return 'Cleric';
    case Classes.Paladin:
      if (level >= 65) return 'Lord Protector';
      else if (level >= 60) return 'Crusader';
      else if (level >= 55) return 'Knight';
      else if (level >= 51) return 'Cavalier';
      else return 'Paladin';
    case Classes.Ranger:
      if (level >= 65) return 'Forest Stalker';
      else if (level >= 60) return 'Warder';
      else if (level >= 55) return 'Outrider';
      else if (level >= 51) return 'Pathfinder';
      else return 'Ranger';
    case Classes.ShadowKnight:
      if (level >= 65) return 'Dread Lord';
      else if (level >= 60) return 'Grave Lord';
      else if (level >= 55) return 'Revenant';
      else if (level >= 51) return 'Reaver';
      else return 'Shadowknight';
    case Classes.Druid:
      if (level >= 65) return 'Storm Warden';
      else if (level >= 60) return 'Hierophant';
      else if (level >= 55) return 'Preserver';
      else if (level >= 51) return 'Wanderer';
      else return 'Druid';
    case Classes.Monk:
      if (level >= 65) return 'Transcendent';
      else if (level >= 60) return 'Grandmaster';
      else if (level >= 55) return 'Master';
      else if (level >= 51) return 'Disciple';
      else return 'Monk';
    case Classes.Bard:
      if (level >= 65) return 'Maestro';
      else if (level >= 60) return 'Virtuoso';
      else if (level >= 55) return 'Troubadour';
      else if (level >= 51) return 'Minstrel';
      else return 'Bard';
    case Classes.Rogue:
      if (level >= 65) return 'Deceiver';
      else if (level >= 60) return 'Assassin';
      else if (level >= 55) return 'Blackguard';
      else if (level >= 51) return 'Rake';
      else return 'Rogue';
    case Classes.Shaman:
      if (level >= 65) return 'Prophet';
      else if (level >= 60) return 'Oracle';
      else if (level >= 55) return 'Luminary';
      else if (level >= 51) return 'Mystic';
      else return 'Shaman';
    case Classes.Necromancer:
      if (level >= 65) return 'Arch Lich';
      else if (level >= 60) return 'Warlock';
      else if (level >= 55) return 'Defiler';
      else if (level >= 51) return 'Heretic';
      else return 'Necromancer';
    case Classes.Wizard:
      if (level >= 65) return 'Arcanist';
      else if (level >= 60) return 'Sorcerer';
      else if (level >= 55) return 'Evoker';
      else if (level >= 51) return 'Channeler';
      else return 'Wizard';
    case Classes.Magician:
      if (level >= 65) return 'Arch Convoker';
      else if (level >= 60) return 'Arch Mage';
      else if (level >= 55) return 'Conjurer';
      if (level >= 51) return 'Elementalist';
      else return 'Magician';
    case Classes.Enchanter:
      if (level >= 65) return 'Coercer';
      else if (level >= 60) return 'Phantasmist';
      else if (level >= 55) return 'Beguiler';
      else if (level >= 51) return 'Illusionist';
      else return 'Enchanter';
    case Classes.Beastlord:
      if (level >= 65) return 'Feral Lord';
      else if (level >= 60) return 'Savage Lord';
      else if (level >= 55) return 'Animist';
      else if (level >= 51) return 'Primalist';
      else return 'Beastlord';
    default:
      return 'Unknown';
  }
};
