import { And, Equal, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Not } from 'typeorm';
import { config } from './config';
import { ForbiddenException } from '@nestjs/common';

export function sanitizeSearch(search: string) {
  if (!search) {
    return null;
  }
  return search
    .replace(/[^a-zA-Z0-9\.\:\(\)\-\s]/g, '') // only alphanuermic and .:()-
    .replace(/\./g, '\\.') // escape all the weird characters .:'`()-
    .replace(/\:/g, '\\:')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\-/g, ' ')
    .toLowerCase()
    .trim();
}

export function selectRelevance(search: string, searchField = 'searchable_name') {
  search = sanitizeSearch(search);
  const searchProportion = `(${search.length} / LENGTH(${searchField}))`;

  const startsWith = `${search}%`;

  const fullMatchRelevance = `((${searchField} = '${search}') * 100 * ${searchProportion})`;
  const startsWithRelevance = `((${searchField} LIKE '${startsWith}') * 10 * ${searchProportion})`;

  const scoredMatch = (matchAgainst: string, multiplier: number, booleanSearch = true) => {
    const matchAgainstWithoutBooleanOperators = matchAgainst
      .replaceAll('\\(', '')
      .replaceAll('\\)', '')
      .replaceAll('~', '')
      .replaceAll('<', '')
      .replaceAll('>', '')
      .replaceAll('+', '')
      .replaceAll('@distance', '')
      .replaceAll('-', '')
      .replaceAll('"', '');

    const matchedProportion = `(${matchAgainst.replaceAll('*', '').length} / LENGTH(${searchField}))`;
    return {
      text: `((MATCH(${searchField}) AGAINST('${matchAgainstWithoutBooleanOperators}' ${
        booleanSearch ? 'IN BOOLEAN MODE' : ''
      })) * ${multiplier} * ${matchedProportion})`,
      param: matchAgainst,
    };
  };

  // Tokenized search
  const searchTokens = search.split(/\s+/);
  const tokenMatches = searchTokens.map((token) => scoredMatch(`*${token}*`, 1));
  const combinedTokenMatches = `(${tokenMatches.map((match) => match.text).join(' * ')})`;

  return `(${fullMatchRelevance} + ${startsWithRelevance} + ${combinedTokenMatches})`;
}

export function bitmaskIncludesBit(bitmask: number, bit: number) {
  return (bit & bitmask) === bit;
}

export function idToBitmask(id: number) {
  return 1 << id;
}

export interface ComparableNumber {
  value?: number;
  operator: '>' | '>=' | '=' | '<=' | '<';
}

function getSqlOperator(operator: '>' | '>=' | '=' | '<=' | '<') {
  if (operator === '>') {
    return MoreThan;
  } else if (operator === '>=') {
    return MoreThanOrEqual;
  } else if (operator === '=') {
    return Equal;
  } else if (operator === '<=') {
    return LessThanOrEqual;
  } else {
    return LessThan;
  }
}

export function compareNumber(comparableNumber: ComparableNumber, notZero = true) {
  if (!comparableNumber || comparableNumber.value === undefined || comparableNumber.value === null) {
    return null;
  }

  const comparison = getSqlOperator(comparableNumber.operator)(comparableNumber.value);

  if (notZero) {
    return And(Not(Equal(0)), comparison);
  } else {
    return comparison;
  }
}

export const getApiKey = (authHeader: string) => {
  if (!authHeader) {
    return null;
  }

  const tokens = authHeader.split(/\s+/);
  return tokens[1] || null;
};

export const validateIsAdmin = (authHeader: string) => {
  const isAdmin = getApiKey(authHeader) === config.apiKey;
  if (!isAdmin) {
    console.log(getApiKey(authHeader));
    throw new ForbiddenException();
  }
};

export enum Duration {
  Minute = 60_000,
  Hour = 60_000 * 60,
  Day = 60_000 * 60 * 24,
}

export const getClassesAsStrings = (classesBitmask: number) => {
  if (!classesBitmask) {
    return null;
  }
  if (classesBitmask === 32767) {
    return ['ALL']; // All
  }
  const bits = Object.keys(classBits).map((key) => parseInt(key));
  return bits.reduce((strings, bit) => {
    return bitmaskIncludesBit(classesBitmask, bit) ? [...strings, classBits[bit]] : strings;
  }, [] as string[]);
};

export const getPlayableRacesAsStrings = (racesBitmask: number) => {
  if (!racesBitmask) {
    return null;
  }
  if (racesBitmask === 16383) {
    return ['ALL']; // All bitmask
  }
  const raceBits = Object.keys(playableRaceBits).map((key) => parseInt(key));
  return raceBits.reduce((strings, bit) => {
    return bitmaskIncludesBit(racesBitmask, bit) ? [...strings, playableRaceBits[bit]] : strings;
  }, [] as string[]);
};

export const playableRaceIds: { [id: number]: string } = {
  0: 'HUM',
  1: 'BAR',
  2: 'ERU',
  3: 'ELF',
  4: 'HIE',
  5: 'DEF',
  6: 'HEF',
  7: 'DWF',
  8: 'TRL',
  9: 'OGR',
  10: 'HLF',
  11: 'GNM',
  12: 'IKS',
  13: 'VAH',
  // 16383: 'ALL', // this changes if froglok or drakkin are added
  // 16384: 'FRG',
  // 32768: 'DRK',
};
export const playableRaceBits = idsToBits(playableRaceIds);

export function idsToBits(object: { [id: number]: string }, offsetBit = 0) {
  const bitmaskObject: { [bitmask: number]: string } = {};
  const ids = Object.keys(object).map((key) => parseInt(key));
  ids.forEach((id) => {
    const bitmask = idToBitmask(id + offsetBit);
    bitmaskObject[bitmask] = object[id];
  });
  return bitmaskObject;
}

export const classIds: { [classNumber: number]: string } = {
  1: 'WAR',
  2: 'CLR',
  3: 'PAL',
  4: 'RNG',
  5: 'SHD',
  6: 'DRU',
  7: 'MNK',
  8: 'BRD',
  9: 'ROG',
  10: 'SHM',
  11: 'NEC',
  12: 'WIZ',
  13: 'MAG',
  14: 'ENC',
  15: 'BST',
  16: 'BER',
};
export const classBits = idsToBits(classIds, -1);

type Job<Result> = () => Promise<Result>;

// Guarantee jobs run one a time
export class JobQueue {
  private jobs: Job<any>[] = [];
  private onDoneMap = new Map<Job<any>, (result: any) => void>();

  private isRunning = false;

  add<Result>(job: Job<Result>, onDone?: (result: Result) => void) {
    this.jobs.push(job);
    this.onDoneMap.set(job, onDone);
    this.run();
  }

  private async run() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    while (this.jobs.length) {
      // Remove the job from the queue
      const job = this.jobs.shift();
      // Wait for the job to run
      let result: any;
      try {
        result = await job();
      } catch (ex) {}
      // Run the onDone callback
      const onDone = this.onDoneMap.get(job);
      if (onDone) {
        this.onDoneMap.delete(job);
        onDone(result);
      }
    }
    this.isRunning = false;
  }
}

// Array where every item is unique and the total number of items is limited
// If you explicitly set an index, you can still get non-unique values in the array, whatevs.  Just don't do that.
export class UniqueArray<T> extends Array<T> {
  constructor(
    private options?: {
      isEqual?: (item1: T, item2: T) => boolean;
      maxLength?: number;
      fifo?: boolean;
    },
  ) {
    super();
  }

  private get isEqual() {
    return this.options?.isEqual || ((item1, item2) => item1 === item2);
  }

  private get maxLength() {
    return this.options?.maxLength || 300;
  }

  private get fifo() {
    return this.options?.fifo !== undefined ? this.options.fifo : true;
  }

  includes(item: T, fromIndex?: number) {
    return this.slice(fromIndex || 0).some((current) => this.isEqual(item, current));
  }

  push(...items: T[]): number {
    this.unshift();
    const newItems = items.filter((item) => !this.includes(item));
    super.push(...newItems);
    this.enforceMaxLength();
    return this.length;
  }

  unshift(...items: T[]): number {
    const newItems = items.filter((item) => !this.includes(item));
    super.unshift(...newItems);
    this.enforceMaxLength();
    return this.length;
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    const slicedIndex = this.slice(fromIndex || 0).findIndex((current) => this.isEqual(searchElement, current));
    return slicedIndex === -1 ? -1 : slicedIndex + (fromIndex || 0);
  }

  private enforceMaxLength() {
    if (!this.maxLength || this.length <= this.maxLength) {
      return;
    }

    if (this.fifo) {
      const excessItemCount = this.length - this.maxLength;
      this.splice(0, excessItemCount);
    } else {
      this.splice(this.maxLength - 1);
    }
  }
}
