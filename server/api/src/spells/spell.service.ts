import { Injectable, NotFoundException } from '@nestjs/common';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { sanitizeSearch, selectRelevance } from '../utils';
import { SpellComponent, SpellNew } from './spell-new.entity';
import { Item } from '../items/item.entity';
import { NpcSpellsEntry, NpcSpells } from './npc-spells.entity';

@Injectable()
export class SpellService {
  constructor(
    @InjectRepository(SpellNew) private spellRepository: Repository<SpellNew>,
    @InjectRepository(NpcSpells)
    private npcSpellsRepository: Repository<NpcSpells>,
    @InjectRepository(NpcSpellsEntry)
    private npcSpellsEntryRepository: Repository<NpcSpellsEntry>,
    @InjectRepository(Item) private itemRepository: Repository<Item>,
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
      },
    });

    spell.summonedItems = await this.getSummonedItems(spell);
    spell.components = await this.getComponents(spell);

    if (!spell) {
      throw new NotFoundException(`Spell ${spellId} not found`);
    }

    return spell;
  }

  private async getNpcSpellsById(
    npcSpellId: number,
    minLevel: number,
    maxLevel: number,
  ) {
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
    const procs: { procChance: number; spellId: number; spell?: SpellNew }[] =
      [];
    const spellIds = new Set<number>();

    // Load all the list and its parents
    let npcSpells: NpcSpells | undefined;
    do {
      npcSpells = await this.getNpcSpellsById(
        npcSpells ? npcSpells.parent_list : npcSpellId,
        minLevel,
        maxLevel,
      );
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
    procs.forEach(
      (proc) =>
        (proc.spell = spells.find((spell) => spell.id === proc.spellId)),
    );
    const casts = spells.filter(
      (spell) => !procs.map((proc) => proc.spellId).includes(spell.id),
    );

    return { procs, casts };
  }

  async getSummonedItems(spell: SpellNew) {
    const summonedItemIds: number[] = [];
    for (let i = 1; i <= 12; i++) {
      if (spell[`effectid${i}`] === 32) {
        summonedItemIds.push(spell[`effect_base_value${i}`]);
      }
    }
    if (!summonedItemIds.length) {
      return [];
    }
    return this.itemRepository.find({ where: { id: In(summonedItemIds) } });
  }

  async getComponents(spell: SpellNew) {
    // Build out the components
    const components: SpellComponent[] = [];
    for (let i = 1; i <= 4; i++) {
      // Expended components
      const componentId = spell[`components${i}`];
      const counts = spell[`component_counts${i}`];
      if (componentId > 0) {
        components.push({ itemId: componentId, counts, isExpended: true });
      }
      // Not expended components
      const noExpendReagentId = spell[`NoexpendReagent${i}`];
      if (noExpendReagentId > 0) {
        components.push({
          itemId: noExpendReagentId,
          counts: 1,
          isExpended: false,
        });
      }
    }

    // Look up the items and match them to the component
    const items = await this.itemRepository.find({
      where: { id: In(components.map((component) => component.itemId)) },
    });
    items.forEach((item) => {
      const matchingComponent = components.find(
        (component) => component.itemId === item.id,
      );
      matchingComponent.item = item;
    });
    return components;
  }
}
