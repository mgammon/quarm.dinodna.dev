import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SkillCap } from './skill-cap.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(SkillCap)
    private skillCapRepository: Repository<SkillCap>,
  ) {}

  async getMaxSkills(
    classId: number,
    level: number,
  ): Promise<{ skillId: number; value: number }[]> {
    return this.skillCapRepository.query(
      `SELECT skillID as skillId, MAX(cap) as value
      FROM skill_caps
      WHERE class = ? AND level <= ?
      GROUP BY skillId`,
      [classId, level],
    );
  }

  getBaseStats(raceId: number, classId: number) {}
}
