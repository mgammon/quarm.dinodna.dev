
export const rollInt = (required: number) => {
  return int(0, 99) < required;
};

export const rollDecimal = (decimal: number) => {
  const roll = Math.random();
  return decimal <= roll;
};

export const int = (low: number, high: number) => {
  // TODO:  idk, figure this out if shits off.  may not matter if i just want relative DPS differences.
  // idk what exactly this is, and googling biased int distribution didn't help.  So I'll hope random is close enough for now.
  // if (low > high)
  //     std::swap(low, high);
  // // EQ uses biased int distribution, so I guess we can support it :P
  // #ifdef BIASED_INT_DIST
  //     return low + m_gen() % (high - low + 1);
  // #else
  //     return int_dist(m_gen, int_param_t(low, high)); // [low, high]
  // #endif

  const range = high - low;
  return low + Math.round(range * Math.random());
};

// same range as client's roll0
// This is their main high level RNG function
export const roll0 = (max: number) => {
  if (max - 1 > 0) {
    return int(0, max - 1);
  }
  return 0;
};

export const rollD20 = (offense: number, mitigation: number) => {
  const atkRoll = roll0(offense + 5);
  const defRoll = roll0(mitigation + 5);

  const avg = (offense + mitigation + 10) / 2;
  let index = Math.max(0, atkRoll - defRoll + avg / 2);
  index = (index * 20) / avg;
  index = Math.max(0, index);
  index = Math.min(19, index);

  return index + 1;
};