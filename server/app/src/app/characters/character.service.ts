import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Player } from './quarm.character';
import { PlayableRaces } from '../api/race';
import { Classes } from '../api/classes';

type PlayerData = [
  apiKey: string,
  name: string,
  level: number,
  raceId: number,
  classId: number,
  str: number,
  sta: number,
  agi: number,
  dex: number,
  int: number,
  wis: number,
  cha: number,
  charm: number | undefined,
  ear: number | undefined,
  head: number | undefined,
  face: number | undefined,
  ear: number | undefined,
  neck: number | undefined,
  shoulder: number | undefined,
  arms: number | undefined,
  back: number | undefined,
  wrist: number | undefined,
  wrist: number | undefined,
  range: number | undefined,
  hands: number | undefined,
  primary: number | undefined,
  secondary: number | undefined,
  fingers: number | undefined,
  fingers: number | undefined,
  chest: number | undefined,
  legs: number | undefined,
  feet: number | undefined,
  waist: number | undefined,
  powersource: number | undefined,
  ammo: number | undefined
];

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
  };

  // savePlayer2 = (player: Player) => {};

  // getPersistedPlayer2 = (player: Player) => {
  //   let { name, level, raceId, classId, allocatedStats } = player;
  //   const { str, sta, agi, dex, int, wis, cha } = allocatedStats;

  //   const slotItems = player.slots
  //     .sort((a, b) => b.slotId - a.slotId)
  //     .map((slot) => slot.item?.id);
  //   const sanitizedName = name ? name.replace(/[^A-Z\s]/gi, '').trim() : null;
  //   const data = [
  //     sanitizedName,
  //     level,
  //     raceId,
  //     classId,
  //     str,
  //     sta,
  //     agi,
  //     dex,
  //     int,
  //     wis,
  //     cha,
  //     slotItems,
  //   ];

  //   const persistedPlayer: PersistedPlayer = {
  //     name: name || 'No name',
  //     level,
  //     raceId,
  //     classId,
  //     slots,
  //     allocatedStats: {
  //       str: allocatedStats.str,
  //       sta: allocatedStats.sta,
  //       agi: allocatedStats.agi,
  //       dex: allocatedStats.dex,
  //       int: allocatedStats.int,
  //       wis: allocatedStats.wis,
  //       cha: allocatedStats.cha,
  //     },
  //   };

  //   return persistedPlayer;
  // };

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
