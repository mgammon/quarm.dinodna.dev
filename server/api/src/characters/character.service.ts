import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Character } from './character.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async create(character: Character, apiKey: string) {
    character.id = undefined;
    character.apiKey = apiKey;
    const characterCount = await this.characterRepository.countBy({ apiKey });
    if (characterCount > 500) {
      throw new BadRequestException();
    }
    const created = await this.characterRepository.save(character);
    return this.mapToDto(created, apiKey);
  }

  async update(id: number, apiKey: string, updates: Partial<Character>) {
    const existsAndOwnedByApiKey = await this.characterRepository.exists({
      where: { id, apiKey },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }

    // Never update id or apiKey
    const { id: _id, apiKey: _apiKey, ...sanitizedUpdates } = updates;

    await this.characterRepository.update({ id }, { ...sanitizedUpdates });
    const updated = await this.characterRepository.findOne({ where: { id } });
    return this.mapToDto(updated, apiKey);
  }

  async getById(id: number, apiKey: string) {
    const character = await this.characterRepository.findOne({ where: { id } });
    return this.mapToDto(character, apiKey);
  }

  async getByApiKey(apiKey: string) {
    const characters = await this.characterRepository.find({
      where: { apiKey },
    });
    return characters.map((character) => this.mapToDto(character, apiKey));
  }

  async deleteById(id: number, apiKey: string) {
    const result = await this.characterRepository.delete({ id, apiKey });
    if (result.affected === 0) {
      throw new Error('Character not found');
    }
  }

  mapToDto(character: Character, apiKey: string) {
    return {
      id: character.id,
      name: character.name,
      guild: character.guild,
      class: character.class,
      race: character.race,
      level: character.level,
      stats: character.stats,
      slots: character.slots,
      updatedAt: character.updatedAt,
      owner: character.apiKey === apiKey,
    };
  }
}
