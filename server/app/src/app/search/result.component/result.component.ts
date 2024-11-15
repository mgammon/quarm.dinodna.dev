import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ApiService } from '../../api/api.service';
import { Item } from '../../items/item.entity';
import { Npc, SpawnGroup } from '../../npcs/npc.entity';
import { SpellNew } from '../../spells/spell.entity';
import { displayName } from '../../utils';
import { ItemComponent } from '../../items/item.component/item.component';
import { SpellComponent } from '../../spells/spell.component/spell.component';
import { TooltipModule } from 'primeng/tooltip';
import { Zone, zoneMap } from '../../zones/zone.entity';
import { classIds } from '../../api/classes';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';

type Entity = Item | Npc | SpellNew | Zone;

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss',
  imports: [
    CommonModule,
    TooltipModule,
    RouterModule,
    AutoCompleteModule,
    ItemComponent,
    SpellComponent,
    BadgeModule,
    AvatarModule,
  ],
})
export class ResultComponent implements OnDestroy {
  public displayName = displayName;

  public destroyed = false;

  @Input()
  entity!: Entity;

  @Input()
  isLink?: boolean;

  fullEntity?: Entity;

  isLoading?: boolean;

  constructor(private apiService: ApiService, private router: Router) {}
  ngOnDestroy(): void {
    this.destroyed = true;
  }

  isItem() {
    return Object.hasOwn(this.entity, 'itemtype');
  }

  getEntityAsItem() {
    return (this.fullEntity || this.entity) as Item;
  }

  getEntityAsSpell() {
    return (this.fullEntity || this.entity) as SpellNew;
  }

  getEntityAsNpc() {
    return this.entity as Npc;
  }

  getEntityAsZone() {
    return (this.fullEntity || this.entity) as Zone;
  }

  isNpc() {
    return Object.hasOwn(this.entity, 'maxlevel');
  }

  isZone() {
    return Object.hasOwn(this.entity, 'long_name');
  }

  isSpell() {
    return Object.hasOwn(this.entity, 'cast_time');
  }

  async onHover() {
    this.isLoading = true;
    this.fullEntity = await (this.isItem()
      ? this.apiService.getItem(this.entity.id)
      : this.isNpc()
      ? this.apiService.getNpc(this.entity.id)
      : this.apiService.getSpell(this.entity.id));
    this.isLoading = false;
  }

  getEntityType() {
    return this.isItem()
      ? 'items'
      : this.isNpc()
      ? 'npcs'
      : this.isZone()
      ? 'zones'
      : 'spells';
  }

  goToEntityPage() {
    if (!this.isLink) {
      return;
    }
    console.log('go to entity page');
    const entityName = this.isItem()
      ? 'items'
      : this.isNpc()
      ? 'npcs'
      : this.isZone()
      ? 'zones'
      : 'spells';
    this.router.navigateByUrl(
      `/${entityName}/${
        this.isZone() ? this.getEntityAsZone().short_name : this.entity.id
      }`
    );
  }

  getNpcZone() {
    const npc = this.getEntityAsNpc();
    if (!npc.zones || !npc.zones.length) {
      npc.zones = [];
      npc.spawnEntries?.forEach((spawnEntry) =>
        (spawnEntry.spawnGroup as unknown as SpawnGroup).spawns?.forEach(
          (spawn) => {
            (npc.zones as string[]).push(spawn.zone);
          }
        )
      );
    }

    return zoneMap.get(npc.zones[0])?.name || null;
  }

  getNpcClass() {
    return classIds[this.getEntityAsNpc().class] || null;
  }

  getNpcLevel() {
    return this.getEntityAsNpc().level;
  }
}
