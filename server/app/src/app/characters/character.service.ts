import { EventEmitter, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Player, Slot } from './quarm/quarm.character';
import { PlayableRaces } from '../api/race';
import { Classes } from '../api/classes';
import { Item } from '../items/item.entity';

export interface InventorySlot {
  slot?: string;
  itemId: number | null;
  item?: Item;
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
  public characters: Player[] = [];

  public characterChangedEvents = new EventEmitter<Player>();

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

    // If we never filled inventory, initialize it
    if (!inventory) {
      inventory = [];
    }

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

    // Parse slots and inventory and load Items
    const slots = characterDto.slots.split(',').map((s) => parseInt(s) || null);
    const slotItemIds = slots.filter((slot) => slot !== null) as number[];
    const inventoryItemIds = characterDto.inventory
      ? (characterDto.inventory
          .filter((slot) => slot.itemId !== null)
          .map((slot) => slot.itemId) as number[])
      : [];
    const itemIds = Array.from(
      new Set([...slotItemIds, ...inventoryItemIds]).values()
    );
    const items = itemIds.length
      ? await this.apiService.getItemSnippets(itemIds)
      : [];
    const slotIdItemMap = new Map<number, Item | undefined>(
      slots.map((itemId, slotId) => {
        const item = items.find((i) => i.id === itemId);
        return [slotId, item];
      })
    );

    // Inventory items
    characterDto.inventory?.forEach((inventorySlot) => {
      inventorySlot.item = items.find((i) => i.id === inventorySlot.itemId);
    });

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
      const updatedDto = await this.apiService.updateCharacter(characterDto);
      const updatedCharacter = await this.mapToPlayer(updatedDto);
      const existingIndex = this.characters.findIndex(
        (existing) => existing.id === updatedCharacter.id
      );
      if (existingIndex > -1) {
        this.characters[existingIndex] = updatedCharacter;
      }
      this.characterChangedEvents.emit(updatedCharacter);
    } else {
      const character = await this.apiService.createCharacter(characterDto);
      this.characters.push(await this.mapToPlayer(character));
      player.id = character.id;
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
    if (!this.characters.length) {
      this.characters = await Promise.all(
        (await this.apiService.getCharacters()).map((c) => this.mapToPlayer(c))
      );
    }
  };

  deletePlayer = async (id: number) => {
    await this.apiService.deleteCharacter(id);
    this.characters = this.characters.filter((c) => c.id !== id);
  };

  createNewCharacter = async (name?: string) => {
    const characterDto = await this.apiService.createCharacter({
      level: 50,
      name,
      class: Classes.Monk,
      race: PlayableRaces.Iksar,
      stats: '',
      slots: '',
    });
    const character = await this.mapToPlayer(characterDto);
    this.characters = [...this.characters, character];
    this.characterChangedEvents.emit(character);
    return character;
  };

  async onZealInventoryFileEvent($event: any, character?: Player) {
    const fileInput = $event.target as any;
    if (!fileInput || !fileInput.files || !fileInput.files.length) {
      return;
    }

    const filePromises: Promise<void>[] = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const file: File = fileInput.files[i];
      if (file.size > 15_000) {
        return;
      }
      filePromises.push(
        new Promise<void>((resolve) => {
          const fileReader = new FileReader();
          fileReader.onload = async (event: ProgressEvent<FileReader>) => {
            await this.parseZealInventoryFile(
              event.target?.result,
              file.name,
              character
            );
            resolve();
          };
          fileReader.readAsText(file);
        })
      );
    }
    await Promise.all(filePromises);
    fileInput.value = '';
  }

  private async parseZealInventoryFile(
    data: ArrayBuffer | string | undefined | null,
    filename: string,
    character?: Player
  ) {
    if (!data || !filename) {
      return;
    }

    // Load the character from the filename, or create a new one
    if (!character) {
      const characterName = filename.split('-')[0] || 'No name';
      await this.loadMyCharacters();

      const existingCharacter = this.characters.find(
        (char) => char.name === characterName
      );
      if (existingCharacter) {
        character = existingCharacter;
      } else {
        character = await this.createNewCharacter(characterName);
      }
    }

    // Parse the text into inventory
    const text = data.toString();
    const lines = text.replaceAll('\r', '').split('\n');
    const inventory = lines.map((line) => {
      const [location, name, id, count, slots] = line.split('\t');
      return {
        location,
        name,
        id: parseInt(id),
        count: parseInt(count),
        slots: parseInt(slots),
      };
    });

    // Load all the items
    const itemIds = new Set(
      inventory?.filter((slot) => !!slot.id).map((slot) => slot.id)
    ) as Set<number>;
    const items = await this.apiService.getItemSnippets(
      Array.from(itemIds.values())
    );

    // Equip everything!
    const equippables = inventory.slice(1, 21);
    equippables.forEach((equippable, index) => {
      const slotId = index + 1;
      const item = items.find((i) => i.id === equippable.id);
      const slot = character?.slots.find(
        (slot) => slot.slotId === slotId
      ) as Slot;
      character?.equip(item, slot);
    });

    // Inventory
    character.inventory = inventory.map((slot, i) => ({
      slot: slot.location,
      item: items.find((i) => i.id === slot.id),
      itemId: slot.id || null,
      count: slot.count,
    }));
    return this.savePlayer(character);
  }
}
