import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Player } from './quarm/quarm.character';
import { PlayableRaces } from '../api/race';
import { Classes } from '../api/classes';
import { Item } from '../items/item.entity';

export interface InventorySlot {
  slot: string;
  itemId: number | null;
  count: number;
}

export interface CharacterDto {
  id: number;
  name?: string;
  guild?: string;
  level: number;
  class: number;
  race: number;

  // array of stats in order: str,sta,agi,dex,wis,int,cha
  stats: string;

  // array of items by slotId, ex: 123,0,2345,66789896,0...
  slots: string;

  updatedAt: string;
  owner: boolean;

  inventory?: InventorySlot[];
}

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  public characterDtos: CharacterDto[] = [];

  constructor(private apiService: ApiService) {}

  async getMaxSkills(classId: number, level: number) {
    const maxSkillsArray = await this.apiService.getMaxSkills(classId, level);
    const maxSkills: { [skillId: number]: number } = {};
    maxSkillsArray.forEach((skill) => {
      maxSkills[skill.skillId] = skill.value;
    });
    return maxSkills;
  }

  mapToCharacterDto = (player: Player) => {
    let { name, level, raceId, classId, allocatedStats, inventory } = player;
    const { str, sta, agi, dex, int, wis, cha } = allocatedStats;
    const stats = [str, sta, agi, dex, wis, int, cha].join(',');
    const slots = [...player.slots]
      .sort((a, b) => a.slotId - b.slotId)
      .map((slot) => slot.item?.id || null)
      .join(',');
    const sanitizedName = name
      ? name.replace(/[^A-Z\s]/gi, '').trim()
      : undefined;

    const characterDto: Partial<CharacterDto> = {
      id: player.id,
      name: sanitizedName,
      level,
      race: raceId,
      class: classId,
      slots,
      stats,
      inventory,
    };

    return characterDto;
  };

  async mapToPlayer(characterDto: CharacterDto) {
    // Parse stats
    const [str, sta, agi, dex, wis, int, cha] = characterDto.stats
      .split(',')
      .map((stat) => parseInt(stat));

    // Parse slots and load Items
    const slots = characterDto.slots.split(',').map((s) => parseInt(s) || null);
    const itemIds = Array.from(
      slots.filter((slot) => slot !== null)
    ) as number[];
    const items = itemIds.length
      ? await this.apiService.getItemSnippets(itemIds)
      : [];
    const slotIdItemMap = new Map<number, Item | undefined>(
      slots.map((itemId, slotId) => {
        const item = items.find((i) => i.id === itemId);
        return [slotId, item];
      })
    );

    return new Player(
      this,
      characterDto.id,
      characterDto.name,
      characterDto.race,
      characterDto.class,
      characterDto.level,
      {
        str: str || 0,
        sta: sta || 0,
        agi: agi || 0,
        dex: dex || 0,
        wis: wis || 0,
        int: int || 0,
        cha: cha || 0,
      },
      slotIdItemMap,
      characterDto.owner,
      characterDto.inventory
    );
  }

  savePlayer = async (player: Player) => {
    const characterDto = this.mapToCharacterDto(player);
    if (player.id) {
      const updated = await this.apiService.updateCharacter(characterDto);
      const existing = this.characterDtos.find(
        (existing) => existing.id === updated.id
      );
      if (existing) {
        existing.name = updated.name;
      }
      return updated;
    } else {
      const character = await this.apiService.createCharacter(characterDto);
      this.characterDtos.push(character);
      player.id = character.id;
      return character;
    }
  };

  loadPlayer = async (id: number) => {
    const characterDto = await this.apiService.getCharacter(id);
    if (!characterDto) {
      return undefined;
    }
    return this.mapToPlayer(characterDto);
  };

  loadMyCharacters = async () => {
    if (!this.characterDtos.length) {
      this.characterDtos = await this.apiService.getCharacters();
    }
  };

  deletePlayer = async (id: number) => {
    await this.apiService.deleteCharacter(id);
    this.characterDtos = this.characterDtos.filter(
      (player) => player.id !== id
    );
  };

  createNewCharacter = async () => {
    const characterDto = await this.apiService.createCharacter({
      level: 50,
      class: Classes.Monk,
      race: PlayableRaces.Iksar,
      stats: '',
      slots: '',
    });
    this.characterDtos = [...this.characterDtos, characterDto];
    return characterDto;
  };
}
