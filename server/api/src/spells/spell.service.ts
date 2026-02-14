import { Injectable, NotFoundException } from '@nestjs/common';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { sanitizeSearch, selectRelevance } from '../utils';
import { SpellComponent, SpellNew } from './spell-new.entity';
import { Item } from '../items/item.entity';
import { NpcSpellsEntry, NpcSpells } from './npc-spells.entity';
import { EntitySummary } from '../misc/entity-summary';
import { ItemService } from '../items/item.service';

@Injectable()
export class SpellService {
  constructor(
    @InjectRepository(SpellNew) private spellRepository: Repository<SpellNew>,
    @InjectRepository(NpcSpells)
    private npcSpellsRepository: Repository<NpcSpells>,
    @InjectRepository(NpcSpellsEntry)
    private npcSpellsEntryRepository: Repository<NpcSpellsEntry>,
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    private itemService: ItemService,
  ) {}

  async search(search: string, page: number = 0, size: number = 100) {
    size = Math.min(100, size) || 100;
    search = sanitizeSearch(search);
    if (!search) {
      return [];
    }

    const results = await this.spellRepository
      .createQueryBuilder('spell')
      .select()
      .addSelect(selectRelevance(search), 'spell_relevance')
      .orderBy('spell_relevance', 'DESC')
      // .where(`searchable_name LIKE :search`, { search: `%${search}%` }) // Despite relevance, it should partially match the name.
      .skip(page * size)
      .take(size)
      .getMany();

    return results.filter((r) => r.relevance > 0);
  }

  async getAllById(spellIds: number[]) {
    return this.spellRepository.find({ where: { id: In(spellIds) } });
  }

  async getById(spellId: number) {
    const spell = await this.spellRepository.findOne({
      where: { id: spellId },
      relations: {
        clickItems: true,
        procItems: true,
        scrollItems: true,
        wornItems: true,
        focusItems: true,
      },
    });

    if (!spell) {
      throw new NotFoundException(`Spell ${spellId} not found`);
    }

    spell.effectItems = await this.getSpellEffectItems(spell);
    spell.effectSpells = await this.getSpellEffectSpells(spell);
    spell.components = await this.getComponents(spell);

    return spell;
  }

  private async getNpcSpellsById(npcSpellId: number, minLevel: number, maxLevel: number) {
    const npcSpells = await this.npcSpellsRepository.findOne({
      where: { id: npcSpellId },
    });
    if (npcSpells) {
      npcSpells.npcSpellEntries = await this.npcSpellsEntryRepository.find({
        where: {
          npc_spells_id: npcSpellId,
          minlevel: LessThanOrEqual(maxLevel),
          maxlevel: MoreThanOrEqual(minLevel),
        },
      });
    }

    return npcSpells;
  }

  async getNpcSpells(npcSpellId: number, minLevel: number, maxLevel: number) {
    const procs: { procChance: number; spellId: number; spell?: SpellNew }[] = [];
    const spellIds = new Set<number>();

    // Load all the list and its parents
    let npcSpells: NpcSpells | undefined;
    do {
      npcSpells = await this.getNpcSpellsById(npcSpells ? npcSpells.parent_list : npcSpellId, minLevel, maxLevel);
      if (npcSpells.proc_chance > 0 && npcSpells.attack_proc > 0) {
        procs.push({
          procChance: npcSpells.proc_chance,
          spellId: npcSpells.attack_proc,
        });
        spellIds.add(npcSpells.attack_proc);
      }
      npcSpells.npcSpellEntries.forEach((entry) => spellIds.add(entry.spellid));
    } while (npcSpells.parent_list);

    // Get all spells, and split them into procs and casts
    const spells = await this.getAllById(Array.from(spellIds.values()));
    procs.forEach((proc) => (proc.spell = spells.find((spell) => spell.id === proc.spellId)));
    const casts = spells.filter((spell) => !procs.map((proc) => proc.spellId).includes(spell.id));

    return { procs, casts };
  }

  async getSpellSummaries(spellIds: number[]): Promise<EntitySummary[]> {
    if (!spellIds || spellIds.length === 0) {
      return [];
    }

    const spells = await this.spellRepository.find({ where: { id: In(spellIds) } });
    return spells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      icon: spell.new_icon,
    }));
  }

  async getSpellEffectItems(spell: SpellNew) {
    // Get a list of the spell effects that have an Item for its value
    const effectIdsWithBaseItemId = [32, 109];
    // const effectIdsWithLimitItemId = []; No effect types with limit value being itemId?
    const spellEffectItems: Partial<EntitySummary>[] = [];
    for (let i = 1; i <= 12; i++) {
      if (effectIdsWithBaseItemId.includes(spell[`effectid${i}`])) {
        spellEffectItems.push({ index: i, id: Math.abs(spell[`effect_base_value${i}`]) });
      }
    }

    // Get the item name and icon
    const items = await this.itemService.getItemSummaries(spellEffectItems.map((item) => item.id));
    for (const spellEffectItem of spellEffectItems) {
      const matchingItem = items.find((item) => item.id === spellEffectItem.id);
      if (matchingItem) {
        spellEffectItem.name = matchingItem.name;
        spellEffectItem.icon = matchingItem.icon;
      }
    }

    return spellEffectItems as EntitySummary[];
  }

  async getSpellEffectSpells(spell: SpellNew) {
    // Get a list of the spell effects that have a Spell for its value
    const effectIdsWithBaseSpellId = [
      139, 85, 201, 289, 323, 333, 377, 386, 387, 406, 407, 419, 427, 429, 442, 443, 453, 454, 476, 481,
    ]; // like excluding spells from a focus
    const effectIdsWithLimitSpellId = [139, 232, 339, 340, 360, 361, 365, 373, 374, 383, 475]; // like a proc chance spell
    const spellEffectSpells: Partial<EntitySummary>[] = [];
    for (let i = 1; i <= 12; i++) {
      if (effectIdsWithBaseSpellId.includes(spell[`effectid${i}`])) {
        spellEffectSpells.push({ index: i, id: Math.abs(spell[`effect_base_value${i}`]) });
      }
      if (effectIdsWithLimitSpellId.includes(spell[`effectid${i}`])) {
        spellEffectSpells.push({ index: i, id: Math.abs(spell[`effect_limit_value${i}`]) });
      }
    }

    // Get the spell name and icon
    const spells = await this.getSpellSummaries(spellEffectSpells.map((spell) => spell.id));
    for (const spellEffectSpell of spellEffectSpells) {
      const matchingSpell = spells.find((spell) => spell.id === spellEffectSpell.id);
      if (matchingSpell) {
        spellEffectSpell.name = matchingSpell.name;
        spellEffectSpell.icon = matchingSpell.icon;
      }
    }

    return spellEffectSpells as EntitySummary[];
  }

  async getComponents(spell: SpellNew) {
    // Build out the components
    const components: Partial<SpellComponent>[] = [];

    for (let i = 1; i <= 4; i++) {
      // Expended components
      const componentId = spell[`components${i}`];
      const counts = spell[`component_counts${i}`];
      if (componentId > 0) {
        components.push({ id: componentId, index: i, counts, isExpended: true });
      }
      // Not expended components
      const noExpendReagentId = spell[`NoexpendReagent${i}`];
      if (noExpendReagentId > 0) {
        components.push({
          id: noExpendReagentId,
          index: i,
          counts: 1,
          isExpended: false,
        });
      }
    }

    const items = await this.itemService.getItemSummaries(components.map((component) => component.id));
    items.forEach((item) => {
      const matchingComponent = components.find((component) => component.id === item.id);
      matchingComponent.name = item.name;
      matchingComponent.icon = item.icon;
    });

    return components as SpellComponent[];
  }
}
