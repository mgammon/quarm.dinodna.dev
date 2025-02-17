import { Classes } from '../../api/classes';
import { ItemTypes, Skills } from '../../api/items';
import { PlayableRaces } from '../../api/race';
import { slotIds, Slots } from '../../api/slots';
import { Item, soldBy } from '../../items/item.entity';
import { Npc } from '../../npcs/npc.entity';
import { SpellNew } from '../../spells/spell.entity';
import { baseStats } from './quarm.classes';
import {
  calcCR,
  calcDR,
  calcFR,
  calcItemBonuses,
  calcMR,
  calcPR,
  calcStat,
} from './quarm.stats';
import {
  AvoidanceStatus,
  checkDoubleAttack,
  checkDualWield,
  clientAttack,
  getHandToHandDelay,
  isWeapon,
} from './quarm.attack';
import { CharacterService, InventorySlot } from '../character.service';
import {
  calcMaxHP,
  clientCalcAC,
  clientCalcMaxMana,
  getATK,
  getMaxWornHastePercent,
} from './quarm.client-mods';

export interface Slot {
  slotIds: number[];
  slotName: string;
  slotId: number;
  item?: Item;
}

export interface Stats {
  ac: number;
  hp: number;
  mana: number;
  str: number;
  sta: number;
  dex: number;
  agi: number;
  int: number;
  wis: number;
  cha: number;
  mr: number;
  fr: number;
  cr: number;
  pr: number;
  dr: number;
  haste: number;
  hpRegen: number;
  manaRegen: number;
  atk: number;
}

export type AllocatableStat =
  | 'str'
  | 'sta'
  | 'dex'
  | 'agi'
  | 'wis'
  | 'int'
  | 'cha';

export interface Simulation {
  misses: number;
  dodges: number;
  parries: number;
  blocks: number;
  ripostes: number;
  primaryDamage: number;
  primaryHits: number;
  secondaryDamage: number;
  secondaryHits: number;
  swings: number;
  doubleAttacks: number;
  dualWieldSuccess: number;
  dualWieldFail: number;
  doubleAttackSuccess: number;
  doubleAttackFail: number;
  minPrimaryDamage: number;
  maxPrimaryDamage: number;
  minSecondaryDamage: number;
  maxSecondaryDamage: number;
  dps: number;
  dualWieldPercent: number;
  doubleAttackPercent: number;
  hitChanceFromFront: number;
  hitChanceFromBehind: number;
}

export abstract class Character {
  public id: number;
  public name?: string;
  public abstract isClient: boolean;
  public raceId: number;
  public classId: number;
  public level: number;
  public slots: Slot[] = [];

  public baseStats!: Stats; // base stats from race/class combo
  public itemBonuses!: Stats; // stats from items
  public spellBonuses!: Stats; // stats from buffs
  public allocatedStats!: Stats; // stats added at character creation
  public aaBonuses!: Stats;
  public stats!: Stats; // all the other stats combined

  public isReadyToSimulate = false;

  public maxSkills!: { [skillId: number]: number };

  constructor(
    protected characterService: CharacterService,
    id: number,
    name: string | undefined,
    raceId: number,
    classId: number,
    level: number
  ) {
    this.id = id;
    this.name = name;
    // Set race/class/level
    this.raceId = raceId === undefined ? PlayableRaces.Iksar : raceId;
    this.classId = classId === undefined ? Classes.Monk : classId;
    this.level = level || 50;

    this.baseStats = getDefaultStats();
    this.itemBonuses = getDefaultStats();
    this.spellBonuses = getDefaultStats();
    this.aaBonuses = getDefaultStats();
    this.stats = getDefaultStats();

    this.initializeMaxSkills();
  }

  protected maxSkillsTimeout: any;
  protected async initializeMaxSkills() {
    clearTimeout(this.maxSkillsTimeout);
    this.maxSkillsTimeout = setTimeout(async () => {
      if (this.level && this.classId) {
        this.isReadyToSimulate = false;
        this.maxSkills = await this.characterService.getMaxSkills(
          this.classId,
          this.level
        );
        this.isReadyToSimulate = true;
      }
    }, 500);
  }

  public async awaitReady() {
    if (this.isReadyToSimulate) {
      return;
    }

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        await this.awaitReady();
        resolve();
      }, 50);
    });
  }

  // be surreeee to callll this, too
  protected abstract initializeStats(): void;

  refreshEquipmentCalcs() {
    calcItemBonuses(this);
    this.calcStats();
    this.afterEquip();
  }

  equip(item: Item | undefined, slot: Slot) {
    // If there's already a slot with this lore item, remove it from the existing slot
    const slotWithThisLoreItem = this.slots.find(
      (s) => s.item?.id === item?.id && item?.name.startsWith('*')
    );
    if (slotWithThisLoreItem) {
      slotWithThisLoreItem.item = undefined;
    }

    if (item === undefined) {
      slot.item = undefined;
    } else {
      slot.item = item;
    }

    const primaryWith2Hander = this.slots.find(
      (s) =>
        s.slotName === 'Primary' &&
        s.item &&
        [1, 4, 35].includes(s.item.itemtype)
    );
    const secondaryWithItem = this.slots.find(
      (s) => s.slotName === 'Secondary' && s.item
    );
    if (primaryWith2Hander && secondaryWithItem) {
      // If we equipped a primary 2hander, unequip the secondary
      if (slot.slotName === 'Primary') {
        secondaryWithItem.item = undefined;
      }
      // If we equipped an offhand with a 2-hander already in the primary, unequip the primary
      if (slot.slotName === 'Secondary') {
        primaryWith2Hander.item = undefined;
      }
    }
    this.refreshEquipmentCalcs();
  }

  afterEquip() {}

  addSpell(spell: SpellNew) {
    this.calcStats();
  }

  removeSpell(spell: SpellNew) {
    this.calcStats();
  }

  async calcStats() {
    this.stats.str = calcStat(this, (stats) => stats.str);
    this.stats.sta = calcStat(this, (stats) => stats.sta);
    this.stats.agi = calcStat(this, (stats) => stats.agi);
    this.stats.dex = calcStat(this, (stats) => stats.dex);
    this.stats.int = calcStat(this, (stats) => stats.int);
    this.stats.wis = calcStat(this, (stats) => stats.wis);
    this.stats.cha = calcStat(this, (stats) => stats.cha);
    this.stats.mr = calcMR(this);
    this.stats.fr = calcFR(this);
    this.stats.cr = calcCR(this);
    this.stats.pr = calcPR(this);
    this.stats.dr = calcDR(this);

    // Secondary stats
    await this.awaitReady();
    this.stats.hp = calcMaxHP(this, false);
    this.stats.mana = clientCalcMaxMana(this);
    this.stats.ac = clientCalcAC(this);
    this.stats.atk = getATK(this);
    this.stats.haste = getMaxWornHastePercent(this); // TODO:  account for more sources of haste, like buffs, clickies, procs, etc
  }

  initializeSlots(slotIdItemMap?: Map<number, Item | undefined>) {
    // Dedupe dumb duplicate slots, like left ear / right ear
    const allSlotLabelValues = Object.keys(slotIds).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: slotIds[id], value: [id] };
    });
    const slotsGroupedByName = allSlotLabelValues.reduce(
      (dedupedSlots, slot) => {
        const existingSlot = dedupedSlots.find((s) => s.label === slot.label);
        if (existingSlot) {
          existingSlot.value.push(...slot.value);
        } else {
          dedupedSlots.push(slot);
        }
        return dedupedSlots;
      },
      [] as { label: string; value: number[] }[]
    );

    // Clear any slots, and then add empty slots back
    while (this.slots.length) {
      this.slots.shift();
    }

    for (let slotId = 0; slotId < Object.keys(slotIds).length; slotId++) {
      const slotName = slotIds[slotId];
      const ids = slotsGroupedByName.find((slots) => slots.label === slotName)
        ?.value as number[];
      const item = slotIdItemMap?.get(slotId);
      this.slots.push({
        slotName,
        slotId,
        slotIds: ids,
        item,
      });
    }

    calcItemBonuses(this);
    this.calcStats();
    this.afterEquip();
  }

  public getSimulation(defender: Character) {
    // There's a IsDualWielding function I should use, but whatever.
    const primary = this.slots.find((s) => s.slotName === 'Primary')?.item;
    const secondary = this.slots.find((s) => s.slotName === 'Secondary')?.item;
    const isPrimaryTwoHander =
      primary && TwoHandedItemTypes.includes(primary.itemtype);
    const isSecondaryWeapon = isWeapon(secondary);
    const emptyFists = !primary && !secondary;
    const canDualWieldEmptyFists =
      this.classId === Classes.Monk || this.classId === Classes.Beastlord;
    const hasDualWieldSkill = this.maxSkills[Skills.DualWield] > 0;
    const canDualWield =
      hasDualWieldSkill &&
      !isPrimaryTwoHander &&
      (isSecondaryWeapon || (emptyFists && canDualWieldEmptyFists));
    const haste = this.stats.haste;

    let primaryDelay = primary?.delay || getHandToHandDelay(this);
    if (haste) {
      primaryDelay = primaryDelay / (1 + haste);
    }
    let secondaryDelay = canDualWield
      ? secondary?.delay || getHandToHandDelay(this)
      : Infinity;
    if (haste) {
      secondaryDelay = secondaryDelay / (1 + haste);
    }
    let primarySwingTimer = 0;
    let secondarySwingTimer = canDualWield ? 0 : Infinity;

    const rounds = 100_000;
    let timeToEllapse = primaryDelay * rounds;
    const simulation: Simulation = {
      misses: 0,
      dodges: 0,
      parries: 0,
      blocks: 0,
      ripostes: 0,
      primaryDamage: 0,
      primaryHits: 0,
      secondaryDamage: 0,
      secondaryHits: 0,
      swings: 0,
      doubleAttacks: 0,
      dualWieldSuccess: 0,
      dualWieldFail: 0,
      doubleAttackSuccess: 0,
      doubleAttackFail: 0,
      minPrimaryDamage: Infinity,
      maxPrimaryDamage: -Infinity,
      minSecondaryDamage: Infinity,
      maxSecondaryDamage: -Infinity,
      dps: 0,
      dualWieldPercent: 0,
      doubleAttackPercent: 0,
      hitChanceFromBehind: 0,
      hitChanceFromFront: 0,
    };
    const start = Date.now();
    while (timeToEllapse >= 0) {
      const nextSwingIn = Math.min(primarySwingTimer, secondarySwingTimer);
      timeToEllapse -= nextSwingIn;
      primarySwingTimer -= nextSwingIn;
      secondarySwingTimer -= nextSwingIn;
      if (primarySwingTimer === 0) {
        primarySwingTimer = primaryDelay;
        this.swing(defender, Slots.Primary, simulation);
      }

      if (canDualWield && secondarySwingTimer === 0) {
        secondarySwingTimer = secondaryDelay;
        if (checkDualWield(this)) {
          simulation.dualWieldSuccess++;
          this.swing(defender, Slots.Secondary, simulation);
        } else {
          simulation.dualWieldFail++;
        }
      }
    }
    // console.log(this);
    // console.log(defender);
    console.log(
      `Simulated ${rounds} rounds in ${(Date.now() - start) / 1000}s`
    );
    console.log('Min Primary Hit', Math.round(simulation.minPrimaryDamage));
    console.log('Max Primary Hit', Math.round(simulation.maxPrimaryDamage));
    console.log(
      'Average Primary Hit',
      Math.round(simulation.primaryDamage / simulation.primaryHits)
    );
    console.log(
      'rDPS',
      (simulation.primaryDamage + simulation.secondaryDamage) /
        ((primaryDelay / 10) * rounds)
    );

    simulation.dps =
      (simulation.primaryDamage + simulation.secondaryDamage) /
      ((primaryDelay / 10) * rounds);
    simulation.doubleAttackPercent = Math.round(
      (simulation.doubleAttackSuccess /
        (simulation.doubleAttackSuccess + simulation.doubleAttackFail)) *
        100
    );
    simulation.dualWieldPercent = Math.round(
      (simulation.dualWieldSuccess /
        (simulation.dualWieldSuccess + simulation.dualWieldFail)) *
        100
    );
    simulation.hitChanceFromBehind =
      ((simulation.primaryHits + simulation.secondaryHits) /
        (simulation.swings -
          simulation.dodges -
          simulation.parries -
          simulation.ripostes)) *
      100;
    simulation.hitChanceFromFront =
      ((simulation.primaryHits + simulation.secondaryHits) /
        simulation.swings) *
      100;

    return simulation;
  }

  private swing(defender: Character, hand: number, simulation: Simulation) {
    const handStr = hand === Slots.Primary ? 'Primary' : 'Secondary';
    // console.log(handStr, this.print(clientAttack(this, defender, hand)));
    // if (checkDoubleAttack(this)) {
    //   console.log(
    //     handStr,
    //     this.print(clientAttack(this, defender, hand)),
    //     'Double attack'
    //   );
    // }
    this.processAttackResult(
      hand,
      clientAttack(this, defender, hand),
      simulation
    );
    if (checkDoubleAttack(this)) {
      simulation.doubleAttackSuccess++;
      this.processAttackResult(
        hand,
        clientAttack(this, defender, hand),
        simulation
      );
    } else {
      simulation.doubleAttackFail++;
    }
  }

  processAttackResult(
    hand: number,
    attackResult: { avoidStatus: AvoidanceStatus; damage: number },
    simulation: Simulation
  ) {
    simulation.swings++;
    if (attackResult.avoidStatus === AvoidanceStatus.Miss) {
      simulation.misses++;
    } else if (attackResult.avoidStatus === AvoidanceStatus.Dodge) {
      simulation.dodges++;
    } else if (attackResult.avoidStatus === AvoidanceStatus.Parry) {
      simulation.parries++;
    } else if (attackResult.avoidStatus === AvoidanceStatus.Block) {
      simulation.blocks++;
    } else if (attackResult.avoidStatus === AvoidanceStatus.Riposte) {
      simulation.ripostes++;
    } else if (attackResult.avoidStatus === AvoidanceStatus.None) {
      if (hand === Slots.Primary) {
        simulation.primaryDamage += attackResult.damage;
        simulation.primaryHits++;
        if (simulation.maxPrimaryDamage < attackResult.damage) {
          simulation.maxPrimaryDamage = attackResult.damage;
        }
        if (simulation.minPrimaryDamage > attackResult.damage) {
          simulation.minPrimaryDamage = attackResult.damage;
        }
      } else {
        simulation.secondaryDamage += attackResult.damage;
        simulation.secondaryHits++;
        if (simulation.maxSecondaryDamage < attackResult.damage) {
          simulation.maxSecondaryDamage = attackResult.damage;
        }
        if (simulation.minSecondaryDamage > attackResult.damage) {
          simulation.minSecondaryDamage = attackResult.damage;
        }
      }
    }
  }
}

export class Player extends Character {
  public isClient: boolean = true;

  public unallocatedStatPoints: number = 0;
  public owned: boolean;

  public inventory?: InventorySlot[];

  constructor(
    protected override characterService: CharacterService,
    id: number,
    name: string | undefined,
    raceId: number,
    classId: number,
    level: number,
    allocatedStats: Partial<Stats>,
    slots: Map<number, Item | undefined>,
    owned: boolean,
    inventory?: InventorySlot[]
  ) {
    super(characterService, id, name, raceId, classId, level);
    this.owned = owned;
    this.initializeStats(allocatedStats);
    this.initializeSlots(slots);
    this.inventory = inventory;
  }

  initializeStats(allocatedStats?: Partial<Stats>) {
    if (!this.classId || this.raceId == null || this.raceId === undefined) {
      return;
    }

    if (!baseStats[this.classId][this.raceId]) {
      console.log('Not a playable class / race combination');
      return;
    }

    this.allocatedStats = { ...getDefaultStats(), ...allocatedStats };

    const [str, sta, agi, dex, wis, int, cha, bonus] =
      baseStats[this.classId][this.raceId];
    this.baseStats.str = str;
    this.baseStats.sta = sta;
    this.baseStats.agi = agi;
    this.baseStats.dex = dex;
    this.baseStats.wis = wis;
    this.baseStats.int = int;
    this.baseStats.cha = cha;

    if (allocatedStats) {
      const spentPoints =
        (allocatedStats.str || 0) +
        (allocatedStats.sta || 0) +
        (allocatedStats.agi || 0) +
        (allocatedStats.dex || 0) +
        (allocatedStats.wis || 0) +
        (allocatedStats.int || 0) +
        (allocatedStats.cha || 0);
      this.unallocatedStatPoints = bonus - spentPoints;
    } else {
      this.unallocatedStatPoints = bonus;
    }

    this.calcStats();
  }

  onCharacterChange() {
    this.initializeStats(this.allocatedStats);
    this.initializeMaxSkills();
    this.refreshEquipmentCalcs();
    this.calcStats();
  }
}

export class NpcCharacter extends Character {
  private npc: Npc;
  public override isClient: boolean = false;

  constructor(characterService: CharacterService, npc: Npc) {
    const levelRange = npc.maxlevel - npc.level;
    const levelMod = levelRange ? Math.round(Math.random() * levelRange) : 0;
    super(
      characterService,
      npc.id,
      npc.name,
      npc.race,
      npc.class,
      npc.level + levelMod
    );
    this.npc = npc;
    this.isClient = false;
    this.initializeStats();
  }

  protected override initializeStats(): void {
    this.baseStats.ac = this.npc.AC;
    this.baseStats.hp = this.npc.hp;
    this.baseStats.mana = this.npc.mana;
    this.baseStats.str = this.npc.STR;
    this.baseStats.sta = this.npc.STA;
    this.baseStats.agi = this.npc.AGI;
    this.baseStats.dex = this.npc.DEX;
    this.baseStats.wis = this.npc.WIS;
    this.baseStats.int = this.npc._INT;
    this.baseStats.cha = this.npc.CHA;
    this.baseStats.mr = this.npc.MR;
    this.baseStats.fr = this.npc.FR;
    this.baseStats.cr = this.npc.CR;
    this.baseStats.dr = this.npc.DR;
    this.baseStats.pr = this.npc.PR;
    this.baseStats.hpRegen = this.npc.combat_hp_regen;
    this.baseStats.manaRegen = this.npc.combat_mana_regen;

    this.calcStats();
  }
}

export const getDefaultStats: () => Stats = () => ({
  ac: 0,
  hp: 0,
  mana: 0,
  str: 0,
  sta: 0,
  dex: 0,
  agi: 0,
  int: 0,
  wis: 0,
  cha: 0,
  mr: 0,
  fr: 0,
  cr: 0,
  pr: 0,
  dr: 0,
  haste: 0,
  hpRegen: 0,
  manaRegen: 0,
  atk: 0,
});

export const TwoHandedItemTypes = [
  ItemTypes.TwoHandSlashing,
  ItemTypes.TwoHandBlunt,
  ItemTypes.TwoHandPiercing,
];
