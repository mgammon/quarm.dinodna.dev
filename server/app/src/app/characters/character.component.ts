import { CommonModule, Location } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Item } from '../items/item.entity';
import { allClasses, classIds } from '../api/classes';
import { playableRaceIds, prettyPlayableRaceIds } from '../api/race';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { SearchComponent } from '../search/search.component';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { ItemLinkComponent } from '../items/item-link.component/item-link.component';
import {
  AllocatableStat,
  NpcCharacter,
  Player,
  Simulation,
  Slot,
} from './quarm/quarm.character';
import { CharacterDto, CharacterService } from './character.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Npc } from '../npcs/npc.entity';
import { TableModule } from 'primeng/table';
import { CharacterSlotComponent } from './slots/character-slot.component';
import { CharacterStatComponent } from './stats/character-stat.component';
import { TagModule } from 'primeng/tag';
import { UsageService } from '../usage.service';
import { PanelModule } from 'primeng/panel';
import { baseStats } from './quarm/quarm.classes';
import { DividerModule } from 'primeng/divider';
import { ApiService } from '../api/api.service';

interface LabelValue<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-character',
  standalone: true,
  templateUrl: './character.component.html',
  styleUrl: './character.component.scss',
  imports: [
    CommonModule,
    SliderModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    DropdownModule,
    InputNumberModule,
    SearchComponent,
    OverlayPanelModule,
    ItemLinkComponent,
    FloatLabelModule,
    InputTextModule,
    TableModule,
    CharacterSlotComponent,
    CharacterStatComponent,
    TagModule,
    PanelModule,
    DividerModule,
  ],
})
export class CharacterComponent {
  public classOptions: LabelValue<number>[];
  public raceOptions: LabelValue<number>[];
  public prettyRaces = prettyPlayableRaceIds;
  public prettyClasses = allClasses;
  public simulation?: Simulation;
  public loading = false;

  public Math = Math;
  character?: Player;
  selectedCharacter?: CharacterDto;

  targetDummy?: NpcCharacter;
  public hideText = true;
  allocatableStats: AllocatableStat[] = [
    'str',
    'sta',
    'agi',
    'dex',
    'wis',
    'int',
    'cha',
  ];

  constructor(
    public characterService: CharacterService,
    private route: ActivatedRoute,
    private usageService: UsageService,
    private location: Location,
    private apiService: ApiService
  ) {
    this.classOptions = this.getClassOptions();
    this.raceOptions = this.getRaceOptions();
  }

  ngOnInit() {
    this.usageService.send('opened character page');
    this.route.params.subscribe(async (params) => {
      const characterId = parseInt(params['id']);
      this.initializeCharacter(characterId);
    });
  }

  onCharacterSelect() {
    this.initializeCharacter(this.selectedCharacter?.id);
  }

  async initializeCharacter(characterId?: number) {
    this.loading = true;
    await this.characterService.loadMyCharacters();
    this.selectedCharacter = this.characterService.characterDtos.find(
      (character) => character.id === characterId
    );
    if (!characterId || !Number.isInteger(characterId)) {
      if (this.characterService.characterDtos.length) {
        const characterDto = this.characterService.characterDtos[0];
        this.character = await this.characterService.mapToPlayer(characterDto);
      } else {
        const characterDto = await this.characterService.createNewCharacter();
        this.character = await this.characterService.mapToPlayer(characterDto);
      }
      this.location.go(`characters/${this.character.id}`);
    } else {
      this.character = await this.characterService.loadPlayer(characterId);
      if (this.character) {
        this.location.go(`characters/${this.character.id}`);
      }
    }
    this.loading = false;
  }

  getClassOptions() {
    return Object.keys(classIds).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: classIds[id], value: id };
    });
  }

  getRaceOptions() {
    return Object.keys(playableRaceIds).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: playableRaceIds[id], value: id };
    });
  }

  onItemSelected({ item, slot }: { item: Item | undefined; slot: Slot }) {
    if (!this.character) {
      return;
    }
    this.character.equip(item, slot);
    this.savePlayer();
  }

  async onNpcSelected(npc: Npc | undefined) {
    if (npc) {
      this.targetDummy = new NpcCharacter(this.characterService, npc);
      this.runSimulation();
    } else {
      this.targetDummy = undefined;
      this.simulation = undefined;
    }
  }

  async runSimulation() {
    if (this.targetDummy && this.character) {
      await this.targetDummy.awaitReady();
      this.simulation = this.character.getSimulation(this.targetDummy);
    }
  }

  onCharacterChange() {
    if (!this.character) {
      return;
    }
    this.character.onCharacterChange();
    this.savePlayer();
  }

  private lastSaveAttemptTimeout: any;
  savePlayer() {
    clearTimeout(this.lastSaveAttemptTimeout);
    this.lastSaveAttemptTimeout = setTimeout(() => {
      if (!this.character || !this.isValidCharacter()) {
        return;
      }
      this.characterService.savePlayer(this.character);
    }, 500);
  }

  // PC: double attack, triple attack, riposte, dual wield, bonus damage, str, dex (procs)
  // NPC: miss chance, dodge chance, AC, riposte chance, parry chance, idk what else

  // Simulation, vs relative damage / optimal damage?

  getBonusDamage() {}

  getMinDamage() {}

  getMaxDamage() {}

  getDamageForRound() {}

  getHaste() {}

  async deleteCharacter() {
    if (this.character?.id) {
      await this.characterService.deletePlayer(this.character?.id);
      if (this.characterService.characterDtos.length === 0) {
        this.initializeCharacter();
      } else {
        this.initializeCharacter(this.characterService.characterDtos[0].id);
      }
    }
  }

  async createNewCharacter() {
    const characterDto = await this.characterService.createNewCharacter();
    this.character = await this.characterService.mapToPlayer(characterDto);
    this.selectedCharacter = characterDto;
  }

  selectCharacter(character: Player) {
    this.character = character;
  }

  isValidRaceClassCombo() {
    return (
      this.character &&
      !!baseStats[this.character.classId][this.character.raceId]
    );
  }

  isValidCharacter() {
    if (!this.character) {
      return false;
    }
    const validLevelRange =
      this.character.level >= 1 && this.character.level <= 65;
    const validRace = this.character.raceId >= 0 && this.character.raceId <= 13;
    const validClass =
      this.character.classId >= 0 && this.character.classId <= 16;
    const validRaceClassCombo = this.isValidRaceClassCombo();

    return validLevelRange && validRace && validClass && validRaceClassCombo;
  }

  onZealInventoryFileChanged($event: any) {
    const fileInput = $event.target as any;
    if (!fileInput || !fileInput.files || !fileInput.files.length) {
      return;
    }
    const file: File = fileInput.files[0];
    const fileReader = new FileReader();
    fileReader.onload = (event: ProgressEvent<FileReader>) =>
      this.parseZealInventoryFile(event.target?.result);
    fileReader.readAsText(file);
  }

  async parseZealInventoryFile(data: ArrayBuffer | string | undefined | null) {
    if (!data) {
      return;
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

    // Load all the items from the equippable parts of the inventory
    const equippables = inventory.slice(1, 21);
    const items = await this.apiService.getItemSnippets(
      equippables.map((equippable) => equippable.id).filter((x) => !!x)
    );

    // Equip everything!
    equippables.forEach((equippable, index) => {
      const slotId = index + 1;
      const item = items.find((i) => i.id === equippable.id);
      const slot = this.character?.slots.find(
        (slot) => slot.slotId === slotId
      ) as Slot;
      this.character?.equip(item, slot);
    });

    this.savePlayer();
  }
}
