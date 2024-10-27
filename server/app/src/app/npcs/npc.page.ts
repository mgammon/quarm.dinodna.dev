import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { ApiService } from '../api/api.service';
import { Npc, Spawn, SpawnGroup, drops, sells } from './npc.entity';
import { NavigationService } from '../navigation.service';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { MapComponent } from '../map/map.component';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { Item } from '../items/item.entity';
import { PriceComponent } from '../items/price.component/price.component';
import { DividerModule } from 'primeng/divider';
import { ItemLinkComponent } from '../items/item-link.component/item-link.component';
import { allClasses } from '../api/classes';
import { allRaceIds } from '../api/race';
import { formatSeconds } from '../utils';
import { MapStore } from '../map/map.service';
import { UsageService } from '../usage.service';
import { SpellLinkComponent } from '../spells/spell-link.component/spell-link.component';
import { BadgeModule } from 'primeng/badge';

enum Tab {
  Drops,
  Sells,
}

@Component({
  selector: 'app-npc-page',
  standalone: true,
  templateUrl: './npc.page.html',
  styleUrl: './npc.page.scss',
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
    ItemLinkComponent,
    SpellLinkComponent,
    BadgeModule,
  ],
})
export class NpcPage {
  public npcId?: number;
  public npc!: Npc;
  public drops!: {
    chancePerCount: number;
    maxCount: number;
    avgCount: number;
    id: number;
    name: string;
    icon: number;
    price: number;
    average7d?: number;
    average30d?: number;
  }[];
  public sells!: Item[];
  public tabIndex!: number;

  public formatSeconds = formatSeconds;

  public spawns: Spawn[] = [];
  public uniqueSpawns: {
    spawnIds: number[];
    spawnCount: number;
    respawntime: number;
    chance: number;
    text: string;
  }[] = [];
  public spawnZones: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private navigationService: NavigationService,
    public router: Router,
    private mapStore: MapStore,
    private usageService: UsageService
  ) {
    this.route.params.subscribe(this.initializePage);
  }

  ngOnInit() {
    this.usageService.send('opened npc page');
  }

  initializePage = async (params: Params) => {
    this.npcId = parseInt(params['id']);
    if (!Number.isInteger(this.npcId)) {
      throw new Error('Bad NPC ID');
    }

    this.npc = await this.apiService.getNpc(this.npcId);
    this.navigationService.addToRecentPages({
      entity: {
        id: this.npc.id,
        name: this.npc.name,
        zones: this.npc.zones,
        class: this.npc.class,
        level: this.npc.level,
        maxlevel: this.npc.maxlevel,
      },
      url: `npcs/${this.npc.id}`,
    });

    this.drops = drops(this.npc);
    this.sells = sells(this.npc);
    await this.setSpawns();
    this.setUniqueSpawnInfo();
    this.spawnZones = this.getSpawnZones();
    this.npc.zones = this.getSpawnZones();

    if (this.drops.length) {
      this.tabIndex = Tab.Drops;
    } else if (this.sells.length) {
      this.tabIndex = Tab.Sells;
    }
  };

  getClass() {
    return allClasses[this.npc.class] || 'Unknown';
  }

  getLevel() {
    const { maxlevel, level } = this.npc;
    return maxlevel && maxlevel !== level ? `${level} - ${maxlevel}` : level;
  }

  getRace() {
    return allRaceIds[this.npc.race] || '';
  }

  getDamage() {
    const { mindmg, maxdmg, attack_delay } = this.npc;
    const minMax = `${mindmg} - ${maxdmg}`;
    const relativeDps = (maxdmg / attack_delay) * 10;

    return `${minMax} DMG`;
  }

  seesInvis() {
    return this.npc.see_invis === 1;
  }

  sometimesSeesInvis() {
    return this.npc.see_invis > 1;
  }

  seesIvu() {
    return this.seesInvis() && this.npc.see_invis_undead;
  }

  isSlow() {
    return this.npc.runspeed < 1.25;
  }

  isFast() {
    return this.npc.runspeed > 1.25 && this.npc.runspeed <= 1.5;
  }

  isVeryFast() {
    return this.npc.runspeed > 1.5;
  }

  doesNotFlee() {
    return this.npc.special_abilities.split('^').includes('21,1');
  }

  hasMagicAttack() {
    return this.npc.special_abilities.split('^').includes('10,1');
  }

  immuneToFear() {
    return this.npc.special_abilities.split('^').includes('17,1');
  }

  immuneToSnare() {
    return this.npc.special_abilities.split('^').includes('16,1');
  }

  immuneToMez() {
    return this.npc.special_abilities.split('^').includes('13,1');
  }

  immuneToCharm() {
    return this.npc.special_abilities.split('^').includes('14,1');
  }

  immuneToLull() {
    return this.npc.special_abilities.split('^').includes('31,1');
  }

  getNpcValue() {
    const [lootTableCoinAvg] = this.npc.lootTable.map((lootTable) => {
      const { mincash, maxcash, avgcoin } = lootTable;
      return avgcoin || (maxcash - mincash) / 2 || 0;
    });
    const coins = Math.round(lootTableCoinAvg || 0);
    const items = Math.round(
      this.drops.reduce(
        (sum, drop) =>
          sum +
          drop.avgCount * (drop.average7d || drop.average30d || drop.price),
        0
      )
    );
    return { coins, items, total: coins + items };
  }

  getSpawnZones() {
    return [
      ...new Set<string>(this.spawns.map((spawn) => spawn.zone)).values(),
    ];
  }

  setUniqueSpawnInfo() {
    const getKey = (chance: number, respawn: number) => `${chance},${respawn}`;
    const uniqueSpawnMap = new Map<string, Spawn[]>();
    this.spawns.forEach((spawn) => {
      spawn.spawnGroup.entries.forEach((spawnEntry) => {
        if (spawnEntry.npcID !== this.npc.id) {
          return;
        }
        const key = getKey(spawnEntry.chance, spawn.respawntime);
        const groupedSpawns =
          uniqueSpawnMap.get(key) ||
          (uniqueSpawnMap.set(key, []).get(key) as Spawn[]);
        groupedSpawns.push(spawn);
      });
    });

    this.uniqueSpawns = [...uniqueSpawnMap.values()].map((groupedSpawns) => {
      const spawnIds = groupedSpawns.map((spawn) => spawn.id);
      const respawntime = groupedSpawns[0].respawntime;
      const chance = groupedSpawns[0].spawnGroup.entries[0].chance;
      return {
        spawnIds,
        spawnCount: spawnIds.length,
        respawntime,
        chance,
        text: `${spawnIds.length} spawns with ${chance}% and ${formatSeconds(
          respawntime
        )} respawn`,
      };
    });
  }

  async setSpawns() {
    if (!this.npc) {
      this.spawns = [];
    }

    const spawnMap = new Map<number, Spawn>();
    const spawnGroupMap = new Map<number, SpawnGroup>();

    this.npc.spawnEntries.forEach((spawnEntry) => {
      spawnEntry.npc = this.npc;
      spawnEntry.spawnGroup.forEach((spawnGroup) => {
        // Initialize a spawnEntry array for the spawn group, and put it in the map for later
        spawnGroup.entries = [];
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

    // Aaand get the other NPCs spawn entries for the spawn groups, since loading the NPC only gets this NPCs spawn entries
    const spawnGroupIds = [...spawnGroupMap.keys()];
    const spawnEntries = await this.apiService.getSpawnEntries(spawnGroupIds);
    spawnEntries.forEach((spawnEntry) => {
      const spawnGroup = spawnGroupMap.get(spawnEntry.spawngroupID);
      if (spawnGroup) {
        spawnGroup.entries.push(spawnEntry);
      }
    });

    this.spawns = [...spawnMap.values()];
  }

  onSpawnMouseEnter(spawnIds: number[]) {
    this.mapStore.markedSpawnIds.next(spawnIds);
  }

  onSpawnMouseLeave(spawnIds: number[]) {
    if (this.mapStore.markedSpawnIds.value === spawnIds) {
      this.mapStore.markedSpawnIds.next([]);
    }
  }
}
