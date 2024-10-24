// import * as _ from 'lodash';
// import { CommonModule } from '@angular/common';
// import { Component, Input } from '@angular/core';
// import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
// import { TabViewModule } from 'primeng/tabview';
// import { CardModule } from 'primeng/card';
// import { PanelModule } from 'primeng/panel';
// import { TableModule } from 'primeng/table';
// import { DividerModule } from 'primeng/divider';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { InputTextModule } from 'primeng/inputtext';
// import { AccordionModule } from 'primeng/accordion';
// import { TooltipModule } from 'primeng/tooltip';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TriStateCheckboxModule } from 'primeng/tristatecheckbox';
// import { ButtonModule } from 'primeng/button';

// import { FormsModule } from '@angular/forms';
// import { Npc, Spawn } from '../../npcs/npc.entity';
// import { MapComponent } from '../../map/map.component';
// import { formatSeconds } from '../../utils';
// import { LiveService } from '../../live.service';
// import { MapStore } from '../../map/map.service';

// interface Respawn {
//   minRespawn: number;
//   maxRespawn: number;
//   time: number;
//   spawnIds: number[];
//   npcMatches: Npc[];
//   minTimeUntilRespawn?: number;
//   maxTimeUntilRespawn?: number;
// }

// @Component({
//   selector: 'app-respawns',
//   standalone: true,
//   templateUrl: './respawns.component.html',
//   styleUrl: './respawns.component.scss',
//   imports: [
//     CommonModule,
//     TabViewModule,
//     CardModule,
//     PanelModule,
//     TableModule,
//     DividerModule,
//     RouterModule,
//     MultiSelectModule,
//     FormsModule,
//     InputTextModule,
//     TooltipModule,
//     MapComponent,
//     InputNumberModule,
//     TriStateCheckboxModule,
//     ButtonModule,
//     AccordionModule,
//   ],
// })
// export class RespawnsComponent {
//   @Input({ required: true })
//   spawns!: Spawn[];

//   public respawns: Respawn[] = [];

//   public formatSeconds = formatSeconds;

//   constructor(private liveService: LiveService, private mapStore: MapStore) {
//     this.liveService.recentKills.subscribe((recentKills) =>
//       this.onRecentKills(recentKills)
//     );

//     setInterval(() => this.updateRespawns(), 1000);
//   }

//   getRespawnTimeText(respawn: Respawn) {
//     if (
//       respawn.maxTimeUntilRespawn === undefined ||
//       respawn.minTimeUntilRespawn === undefined
//     ) {
//       return '';
//     }
//     if (respawn.maxTimeUntilRespawn === respawn.minTimeUntilRespawn) {
//       return formatSeconds(respawn.minTimeUntilRespawn / 1000);
//     } else if (respawn.minTimeUntilRespawn < 0) {
//       return '0s - ' + formatSeconds(respawn.maxTimeUntilRespawn / 1000);
//     } else {
//       return `${formatSeconds(
//         respawn.minTimeUntilRespawn / 1000
//       )} - ${formatSeconds(respawn.maxTimeUntilRespawn / 1000)}`;
//     }
//   }

//   updateRespawn(respawn: Respawn) {
//     const now = Date.now();
//     const minRespawnAt = respawn.minRespawn * 1000 + respawn.time;
//     const minTimeUntilRespawn = minRespawnAt - now;
//     respawn.minTimeUntilRespawn = minTimeUntilRespawn;
//     const maxRespawnAt = respawn.maxRespawn * 1000 + respawn.time;
//     const maxTimeUntilRespawn = maxRespawnAt - now;
//     respawn.maxTimeUntilRespawn = maxTimeUntilRespawn;
//     return respawn;
//   }

//   updateRespawns() {
//     this.respawns.forEach((respawn) => this.updateRespawn(respawn));
//     this.respawns = this.respawns.filter(
//       (respawn) =>
//         respawn.maxTimeUntilRespawn !== undefined &&
//         respawn.maxTimeUntilRespawn > 0
//     );
//   }

//   onRecentKills(recentKills: { time: number; npcMatches: Npc[] }[]) {
//     if (!recentKills.length) {
//       return;
//     }
//     const { npcMatches, time } = recentKills[recentKills.length - 1];
//     const uniqueSpawns = this.getUniqueNpcSpawns(npcMatches);
//     if (!uniqueSpawns) {
//       return;
//     }
//     const { minRespawn, maxRespawn, spawnIds } = uniqueSpawns;
//     const respawn = this.updateRespawn({
//       minRespawn,
//       maxRespawn,
//       spawnIds,
//       time,
//       npcMatches,
//     });

//     this.respawns.push(respawn);
//     console.log(this.respawns);
//   }

//   getUniqueNpcSpawns(npcs: Npc[]) {
//     if (!this.spawns) {
//       return;
//     }
//     const npcIds = npcs.map((npc) => npc.id);
//     const npcSpawns = this.spawns.filter((spawn) =>
//       spawn.spawnGroup.entries.some((spawnEntry) =>
//         npcIds.includes(spawnEntry.npcID)
//       )
//     );
//     const uniqueSpawnMap = new Map<string, Spawn[]>();
//     npcSpawns.forEach((spawn) => {
//       const respawntime = spawn.respawntime;
//       const spawnEntry = spawn.spawnGroup.entries.find((spawnEntry) =>
//         npcIds.includes(spawnEntry.npcID)
//       );
//       if (spawnEntry) {
//         const key = spawnEntry.chance + '_' + respawntime;
//         uniqueSpawnMap.set(key, [...(uniqueSpawnMap.get(key) || []), spawn]);
//       }
//     });

//     let minChance = Infinity;
//     let maxChance = -Infinity;
//     let minRespawn = Infinity;
//     let maxRespawn = -Infinity;
//     let spawnCount = 0;
//     [...uniqueSpawnMap.entries()].forEach((value) => {
//       const [key, spawns] = value;
//       const [chance, respawntime] = key.split('_').map((key) => parseInt(key));
//       spawnCount += spawns.length;
//       minChance = Math.min(minChance, chance);
//       maxChance = Math.max(maxChance, chance);
//       minRespawn = Math.min(minRespawn, respawntime);
//       maxRespawn = Math.max(maxRespawn, respawntime);
//     });

//     const chance =
//       minChance === maxChance ? minChance : `${minChance} - ${maxChance}`;
//     const respawn =
//       minRespawn === maxRespawn
//         ? formatSeconds(minRespawn)
//         : `${formatSeconds(minRespawn)} - ${formatSeconds(maxRespawn)}`;

//     return {
//       text: `${spawnCount} spawn${
//         spawnCount > 1 ? 's' : ''
//       } with ${chance}% chance and ${respawn} respawn`,
//       minRespawn,
//       maxRespawn,
//       spawnIds: npcSpawns.map((spawn) => spawn.id),
//     };
//   }

//   onRespawnMouseEnter(respawn: Respawn) {
//     this.mapStore.markedSpawnIds.next(respawn.spawnIds);
//   }

//   onRespawnMouseLeave(respawn: Respawn) {
//     if (this.mapStore.markedSpawnIds.value === respawn.spawnIds) {
//       this.mapStore.markedSpawnIds.next([]);
//     }
//   }
// }
