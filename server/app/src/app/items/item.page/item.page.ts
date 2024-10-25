import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { NavigationService } from '../../navigation.service';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { MapComponent } from '../../map/map.component';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropsFrom, Item, NpcSpawns, dropsFrom, soldBy } from '../item.entity';
import { PriceComponent } from '../price.component/price.component';
import { DividerModule } from 'primeng/divider';

import { ItemEffects } from '../item-effects.component/item-effects.component';
import { ItemComponent } from '../item.component/item.component';
import { zoneMap } from '../../zones/zone.entity';
import { FormsModule } from '@angular/forms';
import { UsageService } from '../../usage.service';

enum Tab {
  DropsFrom,
  SoldBy,
}

@Component({
  selector: 'app-item-page',
  standalone: true,
  templateUrl: './item.page.html',
  styleUrl: './item.page.scss',
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
    ItemEffects,
    ItemComponent,
    MultiSelectModule,
    FormsModule,
  ],
})
export class ItemPage {
  public itemId?: number;
  public item!: Item;

  public dropsFrom!: DropsFrom[];
  public soldBy!: NpcSpawns[];
  public tabIndex!: number;

  public merchantZones: { label: string; value: string }[] = [];
  public dropZones: { label: string; value: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private navigationService: NavigationService,
    private usageService: UsageService
  ) {
    this.route.params.subscribe(this.initializePage);
  }

  ngOnInit() {
    this.usageService.send('opened item page');
  }

  initializePage = async (params: Params) => {
    this.itemId = parseInt(params['id']);
    if (!Number.isInteger(this.itemId)) {
      throw new Error('Bad Item ID');
    }

    this.item = await this.apiService.getItem(this.itemId);
    this.navigationService.addToRecentPages({
      entity: this.item,
      url: `items/${this.item.id}`,
    });

    console.log(this.item);

    this.dropsFrom = dropsFrom(this.item);
    this.soldBy = soldBy(this.item);

    this.merchantZones = this.getMerchantZones();
    this.dropZones = this.getDroppedZones();

    if (this.dropsFrom.length) {
      this.tabIndex = Tab.DropsFrom;
    } else if (this.soldBy.length) {
      this.tabIndex = Tab.SoldBy;
    }
  };

  getMerchantZones() {
    return [
      ...new Set<string>(this.soldBy.map((merchant) => merchant.zone)).values(),
    ].map((zone) => ({ label: zoneMap.get(zone)?.name || zone, value: zone }));
  }

  getDroppedZones() {
    return [
      ...new Set<string>(this.dropsFrom.map((drop) => drop.zone)).values(),
    ].map((zone) => ({ label: zoneMap.get(zone)?.name || zone, value: zone }));
  }

  getZone(zoneId: string) {
    return zoneMap.get(zoneId)?.name || zoneId;
  }

  getLevel(level: number, maxlevel: number) {
    if (level && maxlevel && level !== maxlevel) {
      return `${level} - ${maxlevel}`;
    }
    return level;
  }
}
