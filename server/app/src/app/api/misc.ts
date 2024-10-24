import { Item } from "../items/item.entity";

export function foodDescription(item: Item) {
  const isFood = item.itemtype === 14;
  if (!isFood) {
    return null;
  }
  const value = item.casttime;
  if (value <= 5) {
    return 'This is a snack.';
  } else if (value <= 20) {
    return 'This is a meal.';
  } else if (value <= 30) {
    return 'This is a hearty meal.';
  } else if (value <= 40) {
    return 'This is a banquet size meal.';
  } else if (value <= 50) {
    return 'This meal is a feast!';
  } else if (value <= 60) {
    return 'This is an enduring meal!';
  } else if (value >= 61) {
    return 'This is a miraculous meal!';
  }
  return null;
}

export function drinkDescription(item: Item) {
  const isDrink = item.itemtype === 15;
  if (!isDrink) {
    return null;
  }
  const value = item.casttime;
  if (value <= 5) {
    return 'This is a whistle wetter.';
  } else if (value <= 20) {
    return 'This is a drink.';
  } else if (value <= 30) {
    return 'This is a refreshing drink.';
  } else if (value <= 40) {
    return 'This is lasting drink.';
  } else if (value <= 50) {
    return 'This meal is a flowing drink!';
  } else if (value <= 60) {
    return 'This is an enduring drink!';
  } else if (value >= 61) {
    return 'This is a miraculous drink!';
  }
  return null;
}

export const clickTypes: { [id: number]: string } = {
  0: 'None',
  1: 'Click from Inventory with Level requirement',
  3: 'Expendable',
  4: 'Must equip.',
  5: 'Click from inventory with Level / Class / Race requirements',
};

export const targetTypes: { [id: number]: string } = {
  0: "Rag'Zhezum Special",
  1: 'Line of Sight',
  3: 'Group V1',
  4: 'Point Blank Area of Effect',
  5: 'Single',
  6: 'Self',
  8: 'Targeted Area of Effect',
  9: 'Animal',
  10: 'Undead',
  11: 'Summoned',
  13: 'Life Tap',
  14: 'Pet',
  15: 'Corpse',
  16: 'Plant',
  17: 'Uber Giants',
  18: 'Uber Dragons',
  20: 'Targeted Area of Effect Life Tap',
  24: 'Area of Effect Undead',
  25: 'Area of Effect Summoned',
  32: 'Area of Effect Caster',
  33: 'NPC Hate List',
  34: 'Dungeon Object',
  35: 'Muramite',
  36: 'Area - PC Only',
  37: 'Area - NPC Only',
  38: 'Summoned Pet',
  39: 'Group No Pets',
  40: 'Area of EffectPC V2',
  41: 'Group v2',
  42: 'Self (Directional)',
  43: 'Group With Pets',
  44: 'Beam',
};

export const resistTypes: { [id: number]: string } = {
  0: 'Unresistable',
  1: 'Magic',
  2: 'Fire',
  3: 'Cold',
  4: 'Poison',
  5: 'Disease',
  6: 'Chromatic (avg resist)',
  7: 'Prismatic (lowest resist)',
  8: 'Physical',
  9: 'Corruption',
};

export const deityBitmasks: { [deityName: string]: number } = {
  Agnostic: 1,
  Bertoxxulous: 2,
  'Brell Serilis': 4,
  'Cazic Thule': 8,
  'Erollsi Marr': 16,
  Bristlebane: 32,
  Innoruuk: 64,
  Karana: 128,
  Mithaniel: 256,
  Prexus: 512,
  Quellious: 1024,
  'Rallos Zek': 2048,
  'Rodcet Nife': 4096,
  'Solusek Ro': 8192,
  'The Tribunal': 16384,
  Tunare: 32768,
  Veeshan: 65536,
};
