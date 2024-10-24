import { bitmaskIncludesBit, idsToBits } from '../utils';

export enum Slots {
  Charm,
  Ear1,
  Head,
  Face,
  Ear2,
  Neck,
  Shoulder,
  Arms,
  Back,
  Wrist,
  Wrist2,
  Range,
  Hands,
  Primary,
  Secondary,
  Finger1,
  Finger2,
  Chest,
  Legs,
  Feet,
  Waist,
  Powersource,
  Ammo,
}

export const slotIds: { [id: number]: string } = {
  0: 'Charm',
  1: 'Ear',
  2: 'Head',
  3: 'Face',
  4: 'Ear',
  5: 'Neck',
  6: 'Shoulder',
  7: 'Arms',
  8: 'Back',
  9: 'Wrist',
  10: 'Wrist',
  11: 'Range',
  12: 'Hands',
  13: 'Primary',
  14: 'Secondary',
  15: 'Fingers',
  16: 'Fingers',
  17: 'Chest',
  18: 'Legs',
  19: 'Feet',
  20: 'Waist',
  21: 'Powersource',
  22: 'Ammo',
};
export const slotBits = idsToBits(slotIds);

export function getSlotsString(slotsBitmask: number, withCommas = false) {
  if (!slotsBitmask) {
    return null;
  }
  const set = new Set<string>(getSlotsAsStrings(slotsBitmask));
  return [...set.values()].join(withCommas ? ', ' : ' ');
}

export function getSlotsAsStrings(slotsBitmask: number) {
  const bits = Object.keys(slotBits).map((key) => parseInt(key));
  return bits.reduce((strings, bit) => {
    return bitmaskIncludesBit(slotsBitmask, bit)
      ? [...strings, slotBits[bit]]
      : strings;
  }, [] as string[]);
}
