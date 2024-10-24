import * as _ from 'lodash';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api/api.service';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { AutoFocusModule } from 'primeng/autofocus';

import { AppStore } from '../app-store.service';
import { Zone } from './zone.entity';
import { FormsModule } from '@angular/forms';

interface PageOptions {
  isTableView?: boolean;
  search?: string;
}

@Component({
  selector: 'app-zones-page',
  standalone: true,
  templateUrl: './zones.page.html',
  styleUrl: './zones.page.scss',
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
    AutoFocusModule,
  ],
})
export class ZonesPage {
  public allZones: Zone[] = [];
  public filteredZones: Zone[] = [];
  public zonesGroupedByExpansion!: { name: string; zones: Zone[] }[];

  public options!: PageOptions;

  public expansionNames = expansionNames;
  public expansionOptions = [
    { value: Expansion.OldWorld, label: expansionNames[Expansion.OldWorld] },
    { value: Expansion.Kunark, label: expansionNames[Expansion.Kunark] },
    { value: Expansion.Velious, label: expansionNames[Expansion.Velious] },
    { value: Expansion.Luclin, label: expansionNames[Expansion.Luclin] },
    { value: Expansion.Planes, label: expansionNames[Expansion.Planes] },
    { value: Expansion.Other, label: expansionNames[Expansion.Other]}
  ];

  constructor(
    private apiService: ApiService,
    public router: Router,
    private appStore: AppStore
  ) {}

  async ngOnInit() {
    this.allZones = this.appStore.get('zonesPageZones') || [];
    this.options = this.appStore.get('zonesPageOptions') || {};
    if (!this.allZones.length) {
      this.allZones = await this.apiService.getAllZones();
    }
    this.filter();
  }

  ngOnDestroy() {
    this.appStore.set('zonesPageZones', this.allZones);
    this.appStore.set('zonesPageOptions', this.options);
  }

  getZonesGroupedByExpansion() {
    const groupedByExpansion: { name: string; zones: Zone[] }[] = [];
    for (let i = 0; i <= 5; i++) {
      groupedByExpansion[i] = { name: expansionNames[i], zones: [] };
    }
    this.filteredZones.forEach((zone) => {
      let expansionGroup = groupedByExpansion[zone.expansion];
      if (!expansionGroup) {
        expansionGroup = groupedByExpansion[Expansion.Other];
      }
      expansionGroup.zones.push(zone);
    });
    return groupedByExpansion;
  }

  filter() {
    if (!this.options.search || this.options.search.trim().length === 0) {
      this.filteredZones = this.allZones;
    } else {
      const trimmedSearch = this.options.search.toLowerCase().trim();
      this.filteredZones = this.allZones.filter(
        (zone) =>
          zone.long_name.toLowerCase().includes(trimmedSearch) ||
          zone.short_name.toLowerCase().includes(trimmedSearch)
      );
    }

    this.zonesGroupedByExpansion = this.zonesGroupedByExpansion =
      this.getZonesGroupedByExpansion();
  }

}

enum Expansion {
  OldWorld = 0,
  Kunark = 1,
  Velious = 2,
  Luclin = 3,
  Planes = 4,
  Other = 5
}

const expansionNames: { [expansion: number]: string } = {
  [Expansion.OldWorld]: 'Old World',
  [Expansion.Kunark]: 'Ruins of Kunark',
  [Expansion.Velious]: 'Scars of Velious',
  [Expansion.Luclin]: 'Shadows of Luclin',
  [Expansion.Planes]: 'Planes of Power',
  [Expansion.Other]: 'Other'
};
