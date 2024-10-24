import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Player } from './quarm.character';
import { PlayableRaces } from '../api/race';
import { Classes } from '../api/classes';

interface PersistedPlayer {
  name: string;
  level: number;
  raceId: number;
  classId: number;
  slots: { slotId: number; itemId: number | undefined }[];
  allocatedStats: {
    str: number;
    sta: number;
    agi: number;
    dex: number;
    int: number;
    wis: number;
    cha: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  constructor(private apiService: ApiService) {}

  async getMaxSkills(classId: number, level: number) {
    const maxSkillsArray = await this.apiService.getMaxSkills(classId, level);
    const maxSkills: { [skillId: number]: number } = {};
    maxSkillsArray.forEach((skill) => {
      maxSkills[skill.skillId] = skill.value;
    });
    return maxSkills;
  }

  getSavedPlayerNames = (): string[] => {
    const playerNamesString = localStorage.getItem('playerNames');
    if (!playerNamesString) {
      return [];
    }
    return JSON.parse(playerNamesString);
  };

  getPersistedPlayer = (player: Player) => {
    let { name, level, raceId, classId, allocatedStats } = player;
    const slots = player.slots.map((s) => ({
      slotId: s.slotId,
      itemId: s.item?.id,
    }));

    const persistedPlayer: PersistedPlayer = {
      name: name || 'No name',
      level,
      raceId,
      classId,
      slots,
      allocatedStats: {
        str: allocatedStats.str,
        sta: allocatedStats.sta,
        agi: allocatedStats.agi,
        dex: allocatedStats.dex,
        int: allocatedStats.int,
        wis: allocatedStats.wis,
        cha: allocatedStats.cha,
      },
    };

    return persistedPlayer;
  }

  savePlayer = (player: Player) => {
    const persistedPlayer = this.getPersistedPlayer(player);

    if (!persistedPlayer.name) {
      throw new Error(`Can't save player without a name`);
    }

    const playerNames = JSON.parse(localStorage.getItem('playerNames') || '[]');
    const playerNamesSet = new Set([...playerNames, name]);
    localStorage.setItem(
      'playerNames',
      JSON.stringify([...playerNamesSet.values()])
    );
    localStorage.setItem(`player-${name}`, JSON.stringify(persistedPlayer));
  };

  loadPlayer = (playerName: string) => {
    const persistedPlayerString = localStorage.getItem(`player-${playerName}`);
    if (!persistedPlayerString) {
      return undefined;
    }
    const persistedPlayer: PersistedPlayer = JSON.parse(persistedPlayerString);
    return new Player(
      this,
      persistedPlayer.name,
      persistedPlayer.raceId,
      persistedPlayer.classId,
      persistedPlayer.level,
      persistedPlayer.allocatedStats
    );
  };

  createNewCharacter = () => {
    return new Player(this, '', PlayableRaces.Iksar, Classes.Monk, 34, {});
  };
}
