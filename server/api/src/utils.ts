import {
  And,
  Equal,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from 'typeorm';

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

export function selectRelevance(
  search: string,
  searchField = 'searchable_name',
) {
  search = sanitizeSearch(search);
  const searchProportion = `(${search.length} / LENGTH(${searchField}))`;

  const startsWith = `${search}%`;

  const fullMatchRelevance = `((${searchField} = '${search}') * 100 * ${searchProportion})`;
  const startsWithRelevance = `((${searchField} LIKE '${startsWith}') * 10 * ${searchProportion})`;

  const scoredMatch = (
    matchAgainst: string,
    multiplier: number,
    booleanSearch = true,
  ) => {
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

    const matchedProportion = `(${
      matchAgainst.replaceAll('*', '').length
    } / LENGTH(${searchField}))`;
    return {
      text: `((MATCH(${searchField}) AGAINST('${matchAgainstWithoutBooleanOperators}' ${
        booleanSearch ? 'IN BOOLEAN MODE' : ''
      })) * ${multiplier} * ${matchedProportion})`,
      param: matchAgainst,
    };
  };

  // Tokenized search
  const searchTokens = search.split(/\s+/);
  const tokenMatches = searchTokens.map((token) =>
    scoredMatch(`*${token}*`, 1),
  );
  const combinedTokenMatches = `(${tokenMatches
    .map((match) => match.text)
    .join(' * ')})`;

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

export function compareNumber(
  comparableNumber: ComparableNumber,
  notZero = true,
) {
  if (
    !comparableNumber ||
    comparableNumber.value === undefined ||
    comparableNumber.value === null
  ) {
    return null;
  }

  const comparison = getSqlOperator(comparableNumber.operator)(
    comparableNumber.value,
  );

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

export enum Duration {
  Minute = 60_000,
  Hour = 60_000 * 60,
  Day = 60_000 * 60 * 24,
}
