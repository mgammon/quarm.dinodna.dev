import { Injectable, NotFoundException } from '@nestjs/common';
import { In, Not, Repository } from 'typeorm';
import { Zone } from './zone.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { NpcService } from '../npcs/npc.service';
import { sanitizeSearch, selectRelevance } from '../utils';

@Injectable()
export class ZoneService {
  public zones: Zone[] = [];

  constructor(
    @InjectRepository(Zone) private zoneRepository: Repository<Zone>,
    private npcService: NpcService,
  ) {
    this.loadZoneNames();
  }

  async loadZoneNames() {
    this.zones = await this.zoneRepository.query(`
      SELECT short_name, id, long_name, file_name FROM zone`);
  }

  async getAll() {
    return this.zoneRepository.find({
      where: { expansion: Not(In([99])) },
      order: { expansion: 'ASC', long_name: 'ASC' },
    });
  }

  async getByShortName(shortName: string) {
    const zone = await this.zoneRepository.findOne({
      where: { short_name: shortName },
    });
    if (!zone) {
      throw new NotFoundException(`Zone ${shortName} not found`);
    }

    const npcs = await this.npcService.complexSearch(
      {
        zones: [shortName],
        sort: {
          field: 'searchable_name',
          order: 1,
        },
        page: 0,
        size: 0,
        minLevel: undefined,
        maxLevel: undefined,
      },
      true,
    );

    zone.npcs = npcs;

    return zone;
  }

  async search(search: string, page: number = 0, size: number = 100) {
    size = Math.min(100, size) || 100;
    search = sanitizeSearch(search);
    if (!search) {
      return [];
    }

    const zones = await this.zoneRepository
      .createQueryBuilder('zone')
      .select()
      .addSelect(selectRelevance(search), 'zone_relevance')
      .orderBy('zone_relevance', 'DESC')
      // .where(`searchable_name LIKE :search`, { search: `%${search}%` }) // Despite relevance, it should partially match the name.
      .skip(page * size)
      .take(size)
      .getMany();

    return zones.filter((r) => r.relevance > 0);
  }
}
