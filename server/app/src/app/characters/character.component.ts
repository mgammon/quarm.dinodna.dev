import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Item } from '../items/item.entity';
import { classIds } from '../api/classes';
import { playableRaceIds } from '../api/race';
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
} from './quarm.character';
import { ApiService } from '../api/api.service';
import { CharacterService } from './character.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Npc } from '../npcs/npc.entity';
import { TableModule } from 'primeng/table';
import { CharacterSlotComponent } from './character-slot.component';
import { CharacterStatComponent } from './character-stat.component';
import { TagModule } from 'primeng/tag';
import { UsageService } from '../usage.service';

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
  ],
})
export class CharacterComponent {
  public classOptions: LabelValue<number>[];
  public raceOptions: LabelValue<number>[];
  public simulation?: Simulation;

  public Math = Math;

  character: Player;

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
    private characterService: CharacterService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private usageService: UsageService
  ) {
    this.classOptions = this.getClassOptions();
    this.raceOptions = this.getRaceOptions();
    this.character =
      this.characterService.loadPlayer('test') ||
      this.characterService.createNewCharacter();
  }

  ngOnInit() {
    this.usageService.send('opened character page');

    this.route.queryParams.subscribe((queryParams) => {
      // const autoLoadZone = queryParams['autoLoadZone'];
      // this.locationService.autoLoadZone = autoLoadZone === 'true';
    });
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
    this.character.equip(item, slot);
    this.updateCharacterUrl();
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
    if (this.targetDummy) {
      await this.targetDummy.awaitReady();
      this.simulation = this.character.getSimulation(this.targetDummy);
    }
  }

  onCharacterChange() {
    // TODO:  debounce
    this.character.onCharacterChange();
    this.updateCharacterUrl();
  }

  updateCharacterUrl() {
    const persistedPlayer = this.characterService.getPersistedPlayer(
      this.character
    );
    const persistedPlayerUrl = `characters?options=${encodeURIComponent(
      JSON.stringify(persistedPlayer)
    )}`;
    this.location.go(persistedPlayerUrl);
  }

  // PC: double attack, triple attack, riposte, dual wield, bonus damage, str, dex (procs)
  // NPC: miss chance, dodge chance, AC, riposte chance, parry chance, idk what else

  // Simulation, vs relative damage / optimal damage?

  getBonusDamage() {}

  getMinDamage() {}

  getMaxDamage() {}

  getDamageForRound() {}

  getHaste() {}
}
