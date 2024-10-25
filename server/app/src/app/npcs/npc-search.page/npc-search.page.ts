import { CommonModule, Location } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { TabViewModule } from 'primeng/tabview';
import { FieldsetModule } from 'primeng/fieldset';
import { MapComponent } from '../../map/map.component';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import * as _ from 'lodash';

import { CheckboxModule } from 'primeng/checkbox';
import { TriStateCheckboxModule } from 'primeng/tristatecheckbox';
import { FormsModule } from '@angular/forms';
import { allRaceIds, bodyTypeIds } from '../../api/race';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';
import { CardModule } from 'primeng/card';
import { allClasses, classIds } from '../../api/classes';
import { Npc, Spawn, SpawnGroup } from '../npc.entity';
import { PriceComponent } from '../../items/price.component/price.component';
import {
  ComparableNumber,
  ComparableNumberInputComponent,
  comparableNumberOperators,
} from '../../items/comparable-number-input.component/comparable-number-input.component';
import { ThemeService } from '../../../themes/theme.service';
import { AppStore } from '../../app-store.service';
import { allZones, zoneMap } from '../../zones/zone.entity';
import { UsageService } from '../../usage.service';

export interface NpcSearchOptions {
  sort: { field: string; order: 1 | -1 };
  page: number;
  size: number;
  zones?: string[];
  search?: string;
  races?: number[];
  classes?: number[];
  bodyTypes?: number[];
  runspeeds?: ComparableNumber[][];
  seesInvis?: boolean;
  seesIvu?: boolean;
  charmable?: boolean;
  // immuneToFear?: boolean;
  fast?: boolean;
  slow?: boolean;
  minLevel: ComparableNumber;
  maxLevel: ComparableNumber;
  exactMatch?: boolean;
}

interface LabelValue<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-npc-search-page',
  standalone: true,
  templateUrl: './npc-search.page.html',
  styleUrl: './npc-search.page.scss',
  imports: [
    CommonModule,
    TabViewModule,
    MapComponent,
    CardModule,
    FieldsetModule,
    TooltipModule,
    PanelModule,
    TableModule,
    PriceComponent,
    DividerModule,
    RouterModule,
    BadgeModule,
    CheckboxModule,
    TriStateCheckboxModule,
    FormsModule,
    MultiSelectModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    ComparableNumberInputComponent,
    ButtonModule,
    AutoFocusModule,
    CardModule,
  ],
})
export class NpcSearchPage {
  public options!: NpcSearchOptions;

  public classOptions: LabelValue<number>[];
  public raceOptions: LabelValue<number>[];
  public bodyTypeOptions: LabelValue<number>[];
  public zoneOptions: LabelValue<string>[];
  public runspeedOptions: LabelValue<ComparableNumber[]>[];

  public comparableNumberOperators = comparableNumberOperators;

  public showFilters = true;

  public loading?: boolean;
  public hasMoreToLoad?: boolean;

  public npcs: Npc[] = [];

  private defaultOptions: NpcSearchOptions = {
    sort: { field: 'searchable_name', order: 1 },
    page: 0,
    size: 50,
    minLevel: { operator: '>=' },
    maxLevel: { operator: '<=' },
  };

  constructor(
    private apiService: ApiService,
    private themeService: ThemeService,
    private appStore: AppStore,
    private location: Location,
    private usageService: UsageService
  ) {
    this.reset(true);
    this.classOptions = this.getClassOptions();
    this.raceOptions = this.getRaceOptions();
    this.bodyTypeOptions = this.getBodyTypeOptions();
    this.zoneOptions = this.getZoneOptions();
    this.runspeedOptions = this.getRunspeedOptions();
  }

  ngOnInit() {
    this.usageService.send('opened npc search page');

    const loadedOptionsFromUrl = this.loadOptionsFromUrl();
    if (loadedOptionsFromUrl) {
      this.npcs = [];
      this.hasMoreToLoad = false;
      this.search();
      return;
    }

    this.npcs = this.appStore.get('npcSearchNpcs') || [];
    this.options =
      this.appStore.get('npcSearchOptions') || _.cloneDeep(this.defaultOptions);
    this.hasMoreToLoad = this.appStore.get('npcSearchHasMoreToLoad') || false;
  }

  loadOptionsFromUrl() {
    try {
      const url = new URL(window.location.href);
      const optionsString = url.searchParams.get('options');
      if (optionsString && optionsString.length) {
        if (optionsString[optionsString.length - 1] === '=') {
          this.options = JSON.parse(optionsString.slice(0, -1));
        } else {
          this.options = JSON.parse(optionsString);
        }
        return true;
      }
    } catch (ex) {
      console.log(ex);
      console.log('Error loading search options from URL!');
    }
    return false;
  }

  resetOptionsInUrl() {
    this.location.go('npcs');
  }

  setOptionsInUrl() {
    const optionsAsString = JSON.stringify(this.options);
    const optionsAsQueryParam = new URLSearchParams(optionsAsString).toString();
    this.location.go(`npcs?options=${optionsAsQueryParam}`);
  }

  ngOnDestroy() {
    this.appStore.set('npcSearchNpcs', this.npcs);
    this.appStore.set('npcSearchOptions', this.options);
    this.appStore.set('npcSearchHasMoreToLoad', this.hasMoreToLoad);
  }

  reset(ignoreUrl: boolean = false) {
    this.npcs = [];
    this.options = _.cloneDeep(this.defaultOptions);
    this.hasMoreToLoad = false;
    if (!ignoreUrl) {
      this.resetOptionsInUrl();
    }
  }

  async search(page: number = 0) {
    if (this.loading) {
      return;
    }

    if (page === 0) {
      this.setOptionsInUrl();
    }

    console.log('Loading page', page);
    this.options.page = page;
    this.loading = true;
    const results = await this.apiService.complexNpcSearch(this.options);
    this.setZones(results);
    this.hasMoreToLoad = results.length === this.options.size;
    if (page === 0) {
      this.npcs = results;
    } else {
      this.npcs = [...this.npcs, ...results];
    }
    setTimeout(() => (this.loading = false), 500);
  }

  @HostListener('window:scroll', ['$event'])
  public onWindowScroll(event: any) {
    document.documentElement.clientHeight;
    const position =
      (document.documentElement.scrollTop || document.body.scrollTop) +
      document.documentElement.clientHeight;
    const max = document.documentElement.scrollHeight - 100;
    if (position >= max) {
      this.nextPage();
    }
  }

  async getSpawns(npc: Npc) {
    if (!npc) {
      return;
    }

    const spawnMap = new Map<number, Spawn>();
    const spawnGroupMap = new Map<number, SpawnGroup>();

    npc.spawnEntries.forEach((spawnEntry) => {
      spawnEntry.npc = npc;
      spawnEntry.spawnGroup.forEach((spawnGroup) => {
        // Initialize a spawnEntry array for the spawn group, and put it in the map for later
        spawnGroup.entries = [spawnEntry];
        const fullSpawnGroup = (spawnGroupMap.get(spawnGroup.id) ||
          spawnGroupMap
            .set(spawnGroup.id, spawnGroup)
            .get(spawnGroup.id)) as SpawnGroup;

        // Make sure spawn.spawnGroup is set, and put it in the map to dedupe (since a different NPC could have the same spawn)
        spawnGroup.spawns
          .filter((spawn) => spawn.enabled)
          .forEach((spawn) => {
            if (!spawnMap.has(spawn.id)) {
              spawn.spawnGroup = fullSpawnGroup;
              spawnMap.set(spawn.id, spawn);
            }
          });
      });
    });

    // Group spawns by zone
    const spawnsByZoneMap = new Map<
      string,
      { zoneId: string; zoneName: string; spawns: Spawn[] }
    >();
    const spawns = [...spawnMap.values()];
    spawns.forEach((spawn) => {
      const spawnInfo =
        spawnsByZoneMap.get(spawn.zone) ||
        spawnsByZoneMap
          .set(spawn.zone, {
            zoneId: spawn.zone,
            zoneName: zoneMap.get(spawn.zone)?.name || 'Unknown',
            spawns: [],
          })
          .get(spawn.zone);
      spawnInfo?.spawns.push(spawn);
    });

    npc.spawns = [...spawnsByZoneMap.values()].filter(
      (spawn) => spawn.zoneName !== 'Unknown'
    );
  }

  setZones(npcs: Npc[]) {
    npcs.forEach((npc) => this.getSpawns(npc));
  }

  nextPage() {
    if (this.hasMoreToLoad && this.npcs.length) {
      this.search(this.options.page + 1);
    }
  }

  getClassOptions() {
    return Object.keys(allClasses).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: allClasses[id], value: id };
    });
  }

  getRaceOptions() {
    return Object.keys(allRaceIds).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: allRaceIds[id], value: id };
    });
  }

  getBodyTypeOptions() {
    return Object.keys(bodyTypeIds).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: bodyTypeIds[id], value: id };
    });
  }

  getZoneOptions() {
    return allZones
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((zone) => ({ label: zone.name, value: zone.id }));
  }

  getRunspeedOptions() {
    const slow: ComparableNumber[] = [{ operator: '<', value: 1.25 }];
    const normal: ComparableNumber[] = [{ operator: '=', value: 1.25 }];
    const fast: ComparableNumber[] = [
      { operator: '>', value: 1.25 },
      { operator: '<=', value: 1.5 },
    ];
    const veryFast: ComparableNumber[] = [{ operator: '>', value: 1.5 }];

    return [
      { label: 'Slow', value: slow },
      { label: 'Normal', value: normal },
      { label: 'Fast', value: fast },
      { label: 'Very Fast', value: veryFast },
    ];
  }

  onSort(newSort: { field: string; order: 1 | -1 }) {
    const oldSort = this.options.sort;
    this.options.sort = newSort;
    if (newSort.field !== oldSort.field || newSort.order !== oldSort.order) {
      this.npcs = [];
      this.search(0);
    }
  }

  getClassString(classId: number) {
    return allClasses[classId] || '';
  }

  getLevel(npc: Npc) {
    const { maxlevel, level } = npc;
    return maxlevel && maxlevel !== level ? `${level} - ${maxlevel}` : level;
  }

  getRace(npc: Npc) {
    return allRaceIds[npc.race] || '';
  }

  getVirtualScrollItemSize(): number {
    if (this.themeService.fontSize < 16) {
      return 26;
    }
    return 46;
  }
}
