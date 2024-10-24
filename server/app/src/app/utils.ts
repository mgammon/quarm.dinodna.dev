import { formatNumber } from '@angular/common';

export function displayName(name: string) {
  return name?.replace(/_/g, ' ').trim();
}

export function formatTime(ms: number, withTicks = false, noDecimals = false) {
  if (ms === 0) {
    return 'Instant';
  }

  // HHh MMm SSs
  const timeFormatted = formatSeconds(ms / 1000);
  // Ticks
  const ticksFormatted = withTicks
    ? ` (${Math.round(ms / 1000 / 6)} ticks)`
    : '';
  // HHh MMm SSs (TT ticks)
  return `${timeFormatted}${ticksFormatted}`;
}

export function idToBitmask(id: number) {
  return 1 << id;
}

export function bitmaskIncludesId(bitmask: number, id: number) {
  const bit = idToBitmask(id);
  return bitmaskIncludesBit(bitmask, bit);
}

export function bitmaskIncludesBit(bitmask: number, bit: number) {
  return (bit & bitmask) === bit;
}

export function idsToBits(object: { [id: number]: string }, offsetBit = 0) {
  const bitmaskObject: { [bitmask: number]: string } = {};
  const ids = Object.keys(object).map((key) => parseInt(key));
  ids.forEach((id) => {
    const bitmask = idToBitmask(id + offsetBit);
    bitmaskObject[bitmask] = object[id];
  });
  return bitmaskObject;
}

export function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const sec = Math.round(seconds % 60);

  const hoursString = hours ? `${hours}h` : null;
  const minutesString = minutes ? `${minutes}m` : null;
  const secString = sec ? `${sec}s` : null;

  return [hoursString, minutesString, secString].filter((x) => x).join(' ');
}
