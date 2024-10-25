import * as _ from 'lodash';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { TriStateCheckboxModule } from 'primeng/tristatecheckbox';
import { ButtonModule } from 'primeng/button';

import { FormsModule } from '@angular/forms';
import { Zone, isAllowedZone } from '../zone.entity';
import { ApiService } from '../../api/api.service';
import { NavigationService } from '../../navigation.service';
import { Npc, Spawn, SpawnGroup } from '../../npcs/npc.entity';
import { allRaceIds } from '../../api/race';
import { allClasses } from '../../api/classes';
import { MapComponent } from '../../map/map.component';
import { ThemeService } from '../../../themes/theme.service';
import { formatSeconds } from '../../utils';
import { AppStore } from '../../app-store.service';
import { MapStore } from '../../map/map.service';
import { ComparableNumber } from '../../items/comparable-number-input.component/comparable-number-input.component';
import { UsageService } from '../../usage.service';

interface ZoneSpawnFilterOptions {
  zRange?: [number, number];
  search?: string;
  minLevel?: number;
  maxLevel?: number;
  races?: number[];
  classes?: number[];
  seesInvis?: boolean;
  runspeeds?: ComparableNumber[][];
}

interface LabelValue<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-zone-details-page',
  standalone: true,
  templateUrl: './zone-details.page.html',
  styleUrl: './zone-details.page.scss',
  imports: [
    CommonModule,
    TabViewModule,
    CardModule,
    PanelModule,
    TableModule,
    DividerModule,
    RouterModule,
    MultiSelectModule,
    FormsModule,
    InputTextModule,
    TooltipModule,
    MapComponent,
    InputNumberModule,
    TriStateCheckboxModule,
    ButtonModule,
    // RespawnsComponent,
  ],
})
export class ZoneDetailsPage implements OnInit {
  public zoneShortName?: string;
  public zone?: Zone;

  public runspeedOptions: LabelValue<ComparableNumber[]>[];
  public filterOptions: ZoneSpawnFilterOptions = {};

  public filteredSpawns: Spawn[] = [];
  public filteredNpcs: Npc[] = [];
  public markedNpcIds?: number[];

  public classOptions = this.getClassOptions();
  public raceOptions = this.getRaceOptions();

  public respawns: {
    minRespawn: number;
    maxRespawn: number;
    time: number;
    spawnIds: number[];
    npcMatches: Npc[];
  }[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private navigationService: NavigationService,
    private themeService: ThemeService,
    private appStore: AppStore,
    private mapStore: MapStore,
    private usageService: UsageService
  ) {
    this.route.params.subscribe(this.initializePage);
    this.runspeedOptions = this.getRunspeedOptions();
  }

  ngOnInit() {
    this.usageService.send('opened zone-details page');
  }

  initializePage = async (params: Params) => {
    this.zoneShortName = params['id'];
    if (!this.zoneShortName || !isAllowedZone(this.zoneShortName)) {
      throw new Error('Bad zone name');
    }

    const lastLoadedZone = this.appStore.get('zoneDetailsLastLoadedZone');
    this.appStore.set('zoneDetailsLastLoadedZone', this.zoneShortName);

    if (lastLoadedZone === this.zoneShortName) {
      this.loadFromAppStore();
    } else {
      this.loadFromApi();
    }
  };

  reset() {
    this.filterOptions = {};
    this.filterSpawnsAndNpcs();
  }

  async loadFromApi() {
    if (!this.zoneShortName) {
      return;
    }
    this.zone = await this.apiService.getZone(this.zoneShortName);
    this.navigationService.addToRecentPages({
      entity: {
        short_name: this.zoneShortName,
        long_name: this.zone?.long_name,
      },
      url: `zones/${this.zone?.short_name}`,
    });
    this.filterOptions = {};
    this.getSpawns();
  }

  loadFromAppStore() {
    this.zone = this.appStore.get('zoneDetailsZone');
    this.filterOptions = this.appStore.get('zoneDetailsFilterOptions') || {};
    this.filteredSpawns = this.appStore.get('zoneDetailsFilteredSpawns') || [];
    this.filteredNpcs = this.appStore.get('zoneDetailsFilteredNpcs') || [];
    this.markedNpcIds = this.appStore.get('zoneDetailsMarkedNpcIds') || [];
  }

  ngOnDestroy() {
    this.appStore.set('zoneDetailsZone', this.zone);
    this.appStore.set('zoneDetailsFilterOptions', this.filterOptions);
    this.appStore.set('zoneDetailsFilteredSpawns', this.filteredSpawns);
    this.appStore.set('zoneDetailsFilteredNpcs', this.filteredNpcs);
    this.appStore.set('zoneDetailsMarkedNpcIds', this.markedNpcIds);
    this.appStore.set('zoneDetailsLastLoadedZone', this.zoneShortName);
  }

  getClassString(npc: Npc) {
    return allClasses[npc.class] || '';
  }

  getLevel(npc: Npc) {
    const { maxlevel, level } = npc;
    return maxlevel && maxlevel !== level ? `${level} - ${maxlevel}` : level;
  }

  getRace(npc: Npc) {
    return allRaceIds[npc.race] || '';
  }

  getSpawns() {
    if (!this.zone || !this.zone.npcs) {
      return;
    }

    const spawnMap = new Map<number, Spawn>();
    const spawnGroupMap = new Map<number, SpawnGroup>();

    this.zone.npcs.forEach((npc) =>
      npc.spawnEntries.forEach((spawnEntry) => {
        spawnEntry.npc = npc;
        spawnEntry.spawnGroup.forEach((spawnGroup) => {
          spawnGroup.entries = [];
          // Make sure this NPC's spawnEntry is added to the spawnGroup
          const fullSpawnGroup = (spawnGroupMap.get(spawnGroup.id) ||
            spawnGroupMap
              .set(spawnGroup.id, spawnGroup)
              .get(spawnGroup.id)) as SpawnGroup;
          fullSpawnGroup.entries.push(spawnEntry);

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
      })
    );

    this.zone.spawns = [...spawnMap.values()];
    this.zone.npcs.forEach((npc) => {
      (npc as any).spawns = this.getUniqueNpcSpawns([npc]); // dumb but idk
    });
    this.filterSpawnsAndNpcs();
  }

  onZRangeChange = (zRange: [number, number]) => {
    this.filterOptions.zRange = zRange;
    this.filterNpcs();
  };

  filterNpcs() {
    if (!this.zone?.spawns || !this.zone?.npcs) {
      return;
    }

    this.filteredNpcs = this.zRangeFilter(this.zone.npcs)
      .filter(this.searchFilter)
      .filter(this.minLevelFilter)
      .filter(this.maxLevelFilter)
      .filter(this.classFilter)
      .filter(this.raceFilter)
      .filter(this.seesInvisFilter)
      .filter(this.runspeedFilter);
    this.markedNpcIds =
      this.filteredNpcs.length === this.zone.npcs.length
        ? undefined
        : this.filteredNpcs.map((npc) => npc.id);
  }

  filterSpawns() {
    if (!this.zone?.spawns) {
      return;
    }

    this.filteredSpawns = this.zone.spawns.filter(this.filterSpawn);
  }

  filterSpawn = (spawn: Spawn) => {
    return spawn.spawnGroup.entries.some((spawnEntry) => {
      const { npc } = spawnEntry;
      return (
        this.searchFilter(npc) &&
        this.minLevelFilter(npc) &&
        this.maxLevelFilter(npc) &&
        this.classFilter(npc) &&
        this.raceFilter(npc) &&
        this.seesInvisFilter(npc)
      );
    });
  };

  filterSpawnsAndNpcs() {
    this.filterSpawns();
    this.filterNpcs();
  }

  searchFilter = (npc: Npc) => {
    if (!this.filterOptions.search || !this.filterOptions.search.trim()) {
      return true;
    }

    const search = this.filterOptions.search.toLowerCase().trim();
    return npc.name.toLowerCase().includes(search);
  };

  minLevelFilter = (npc: Npc) => {
    if (
      this.filterOptions.minLevel === null ||
      this.filterOptions.minLevel === undefined ||
      this.filterOptions.minLevel <= 0
    ) {
      return true;
    }
    return npc.maxlevel >= this.filterOptions.minLevel;
  };

  maxLevelFilter = (npc: Npc) => {
    if (
      this.filterOptions.maxLevel === null ||
      this.filterOptions.maxLevel === undefined ||
      this.filterOptions.maxLevel <= 0
    ) {
      return true;
    }
    return npc.level <= this.filterOptions.maxLevel;
  };

  classFilter = (npc: Npc) => {
    if (!this.filterOptions.classes) {
      return true;
    }
    return this.filterOptions.classes.includes(npc.class);
  };

  raceFilter = (npc: Npc) => {
    if (!this.filterOptions.races) {
      return true;
    }
    return this.filterOptions.races.includes(npc.race);
  };

  seesInvisFilter = (npc: Npc) => {
    const { seesInvis } = this.filterOptions;
    if (seesInvis === true) {
      return npc.see_invis > 0;
    } else if (seesInvis === false) {
      return npc.see_invis <= 0;
    }
    return true;
  };

  runspeedFilter = (npc: Npc) => {
    const { runspeeds } = this.filterOptions;
    if (!runspeeds || !runspeeds.length) {
      return true;
    }

    return runspeeds.some((runspeed) =>
      runspeed.every((speed) => {
        const { operator, value } = speed;
        if (!value) {
          return true;
        }

        return (
          (operator === '>=' && npc.runspeed >= value) ||
          (operator === '>' && npc.runspeed > value) ||
          (operator === '<=' && npc.runspeed <= value) ||
          (operator === '<' && npc.runspeed < value)
        );
      })
    );
  };

  // There is no zRangeSpawnFilter, because the map handles that itself for performance reasons.
  zRangeFilter(npcs: Npc[]): Npc[] {
    if (!this.zone?.spawns || !this.filterOptions.zRange) {
      return npcs;
    }
    const [minZ, maxZ] = this.filterOptions.zRange;
    const visibleSpawns = this.zone.spawns.filter((spawn) => {
      if (!this.filterOptions.zRange) {
        return true;
      }
      return spawn.z >= minZ && spawn.z < maxZ;
    });

    const npcIds = _.flatten(
      visibleSpawns.map((spawn) =>
        spawn.spawnGroup.entries.map((spawnEntry) => spawnEntry.npcID)
      )
    );

    return npcs.filter((npc) => npcIds.includes(npc.id));
  }

  getUniqueNpcSpawns(npcs: Npc[]) {
    if (!this.zone?.spawns) {
      return;
    }
    const npcIds = npcs.map((npc) => npc.id);
    const npcSpawns = this.zone.spawns.filter((spawn) =>
      spawn.spawnGroup.entries.some((spawnEntry) =>
        npcIds.includes(spawnEntry.npcID)
      )
    );
    const uniqueSpawnMap = new Map<string, Spawn[]>();
    npcSpawns.forEach((spawn) => {
      const respawntime = spawn.respawntime;
      const spawnEntry = spawn.spawnGroup.entries.find((spawnEntry) =>
        npcIds.includes(spawnEntry.npcID)
      );
      if (spawnEntry) {
        const key = spawnEntry.chance + '_' + respawntime;
        uniqueSpawnMap.set(key, [...(uniqueSpawnMap.get(key) || []), spawn]);
      }
    });

    let minChance = Infinity;
    let maxChance = -Infinity;
    let minRespawn = Infinity;
    let maxRespawn = -Infinity;
    let spawnCount = 0;
    [...uniqueSpawnMap.entries()].forEach((value) => {
      const [key, spawns] = value;
      const [chance, respawntime] = key.split('_').map((key) => parseInt(key));
      spawnCount += spawns.length;
      minChance = Math.min(minChance, chance);
      maxChance = Math.max(maxChance, chance);
      minRespawn = Math.min(minRespawn, respawntime);
      maxRespawn = Math.max(maxRespawn, respawntime);
    });

    const chance =
      minChance === maxChance ? minChance : `${minChance} - ${maxChance}`;
    const respawn =
      minRespawn === maxRespawn
        ? formatSeconds(minRespawn)
        : `${formatSeconds(minRespawn)} - ${formatSeconds(maxRespawn)}`;

    return {
      text: `${spawnCount} spawn${
        spawnCount > 1 ? 's' : ''
      } with ${chance}% chance and ${respawn} respawn`,
      minRespawn,
      maxRespawn,
      spawnIds: npcSpawns.map((spawn) => spawn.id),
    };
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

  getVirtualScrollItemSize(): number {
    if (this.themeService.fontSize < 16) {
      return 26;
    }
    return 46;
  }

  onNpcMouseEnter(npc: Npc) {
    this.mapStore.markedSpawnIds.next((npc.spawns as any).spawnIds);
  }

  onNpcMouseLeave(npc: Npc) {
    if (this.mapStore.markedSpawnIds.value === (npc.spawns as any).spawnIds) {
      this.mapStore.markedSpawnIds.next([]);
    }
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

  getRunspeedLabel(runspeed: number) {
    if (runspeed < 1.25) {
      return 'Slow';
    } else if (runspeed === 1.25) {
      return 'Normal';
    } else if (runspeed > 1.25 && runspeed <= 1.5) {
      return 'Fast';
    } else if (runspeed > 1.5) {
      return 'Very Fast';
    } else {
      return runspeed;
    }
  }
}
