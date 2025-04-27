import { Injectable } from '@nestjs/common';
import { Like, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Rule } from './rule.entity';
import { Zone } from '../zones/zone.entity';

interface RespawnReduction {
  min: number;
  max: number;
  value: number;
}

@Injectable()
export class RespawnService {
  private respawnReductions: {
    normal: { lower: RespawnReduction; higher: RespawnReduction };
    dungeon: { lower: RespawnReduction; higher: RespawnReduction };
  };
  private reducedRespawnZones!: Zone[];

  private rulePrefix = `Quarm:RespawnReduction`;

  constructor(
    @InjectRepository(Rule) private ruleRepository: Repository<Rule>,
    @InjectRepository(Zone) private zoneRepository: Repository<Zone>,
  ) {
    this.loadRespawnRules();
  }

  async loadRespawnRules() {
    const respawnRules = await this.ruleRepository.find({
      where: { rule_name: Like(`${this.rulePrefix}%`) },
    });

    const getSeconds = (rule_name: string) =>
      Math.round(
        parseInt(
          respawnRules.find((rule) => rule.rule_name === rule_name).rule_value,
        ) / 1000,
      );

    this.respawnReductions = {
      normal: {
        lower: {
          min: getSeconds(this.rulePrefix + 'LowerBoundMin'),
          max: getSeconds(this.rulePrefix + 'LowerBoundMax'),
          value: getSeconds(this.rulePrefix + 'LowerBound'),
        },
        higher: {
          min: getSeconds(this.rulePrefix + 'HigherBoundMin'),
          max: getSeconds(this.rulePrefix + 'HigherBoundMax'),
          value: getSeconds(this.rulePrefix + 'HigherBound'),
        },
      },
      dungeon: {
        lower: {
          min: getSeconds(this.rulePrefix + 'DungeonLowerBoundMin'),
          max: getSeconds(this.rulePrefix + 'DungeonLowerBoundMax'),
          value: getSeconds(this.rulePrefix + 'DungeonLowerBound'),
        },
        higher: {
          min: getSeconds(this.rulePrefix + 'DungeonHigherBoundMin'),
          max: getSeconds(this.rulePrefix + 'DungeonHigherBoundMax'),
          value: getSeconds(this.rulePrefix + 'DungeonHigherBound'),
        },
      },
    };
    this.reducedRespawnZones = await this.zoneRepository.find({
      where: { reducedspawntimers: MoreThan(0) },
    });
  }

  getRespawnTime(zoneId: string, respawntime: number, level: number) {
    const zone = this.reducedRespawnZones.find(
      (zone) => zone.short_name === zoneId,
    );
    if (!zone) {
      return respawntime;
    }

    const respawnReductions =
      zone.castdungeon > 0
        ? this.respawnReductions.dungeon
        : this.respawnReductions.normal;

    // Fast respawns are only in dungeons, or below level 15
    if (zone.castdungeon <= 0 && level >= 15) {
      return respawntime;
    }

    if (
      respawntime >= respawnReductions.lower.min &&
      respawntime <= respawnReductions.lower.max
    ) {
      return respawnReductions.lower.value;
    } else if (
      respawntime >= respawnReductions.higher.min &&
      respawntime <= respawnReductions.higher.max
    ) {
      return respawnReductions.higher.value;
    } else {
      return respawntime;
    }
  }
}
