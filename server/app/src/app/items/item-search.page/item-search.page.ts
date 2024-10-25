import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { TabViewModule } from 'primeng/tabview';
import { FieldsetModule } from 'primeng/fieldset';
import { MapComponent } from '../../map/map.component';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { PriceComponent } from '../price.component/price.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import * as _ from 'lodash';

import { ItemEffects } from '../item-effects.component/item-effects.component';
import { ItemComponent } from '../item.component/item.component';
import { CheckboxModule } from 'primeng/checkbox';
import { TriStateCheckboxModule } from 'primeng/tristatecheckbox';
import { FormsModule } from '@angular/forms';
import { playableRaceIds } from '../../api/race';
import {
  ComparableNumber,
  ComparableNumberInputComponent,
  comparableNumberOperators,
} from '../comparable-number-input.component/comparable-number-input.component';
import { DividerModule } from 'primeng/divider';
import { ItemLinkComponent } from '../item-link.component/item-link.component';
import { Item } from '../item.entity';
import { ButtonModule } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';
import { CardModule } from 'primeng/card';
import { classIds } from '../../api/classes';
import { getSlotsAsStrings, getSlotsString, slotIds } from '../../api/slots';
import { itemTypes } from '../../api/items';
import { AppStore } from '../../app-store.service';
import { UsageService } from '../../usage.service';

interface EffectFilter {
  id: number;
  baseValue:
    | 'percentNegative'
    | 'percentPositive'
    | 'amountNegative'
    | 'amountPositive';
  hasDuration?: boolean;
}

export interface ItemSearchOptions {
  sort: { field: string; order: 1 | -1 };
  page: number;
  size: number;
  search?: string;
  races?: number[];
  classes?: number[];
  slots?: number[][];
  itemType?: number[];
  effect?: EffectFilter; // like haste, DS, HP regen, etc.
  stats: {
    sta: ComparableNumber;
    str: ComparableNumber;
    dex: ComparableNumber;
    agi: ComparableNumber;
    cha: ComparableNumber;
    int: ComparableNumber;
    wis: ComparableNumber;
    mana: ComparableNumber;
    hp: ComparableNumber;
    ac: ComparableNumber;
    dmg: ComparableNumber;
    delay: ComparableNumber;
    mr: ComparableNumber;
    fr: ComparableNumber;
    cr: ComparableNumber;
    pr: ComparableNumber;
    dr: ComparableNumber;
    weight: ComparableNumber;
    average7d: ComparableNumber;
    average30d: ComparableNumber;
  };
  magic?: boolean;
  lore?: boolean;
  noDrop?: boolean;
  noRent?: boolean;
  sources?: ('vendor' | 'drop' | 'tradeskill' | 'unknown')[];
  effectType?: 'click' | 'worn' | 'proc' | 'scroll';
}

interface LabelValue<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-item-search-page',
  standalone: true,
  templateUrl: './item-search.page.html',
  styleUrl: './item-search.page.scss',
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
    CheckboxModule,
    TriStateCheckboxModule,
    FormsModule,
    MultiSelectModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    ComparableNumberInputComponent,
    ItemLinkComponent,
    ButtonModule,
    AutoFocusModule,
    CardModule,
  ],
})
export class ItemSearchPage implements OnInit {
  public options!: ItemSearchOptions;

  public showItemTypes = true;
  public showResists = false;
  public showStats = false;

  public classOptions: LabelValue<number>[];
  public raceOptions: LabelValue<number>[];
  public slotOptions: LabelValue<number[]>[]; // number[], since Ear and Wrist maps to 2 slots
  public itemTypeOptions: LabelValue<number>[];
  public effectOptions: LabelValue<EffectFilter>[];

  public comparableNumberOperators = comparableNumberOperators;

  public loading?: boolean;
  public hasMoreToLoad?: boolean;

  public items: Item[] = [];

  private defaultOptions: ItemSearchOptions = {
    sort: { field: 'name', order: 1 },
    page: 0,
    size: 50,
    stats: {
      sta: { operator: '>' },
      str: { operator: '>' },
      dex: { operator: '>' },
      agi: { operator: '>' },
      cha: { operator: '>' },
      int: { operator: '>' },
      wis: { operator: '>' },
      mana: { operator: '>' },
      hp: { operator: '>' },
      ac: { operator: '>' },
      dmg: { operator: '>' },
      delay: { operator: '>' },
      mr: { operator: '>' },
      fr: { operator: '>' },
      cr: { operator: '>' },
      pr: { operator: '>' },
      dr: { operator: '>' },
      weight: { operator: '<' },
      average7d: { operator: '<' },
      average30d: { operator: '<' },
    },
  };

  constructor(
    private apiService: ApiService,
    private appStore: AppStore,
    private location: Location,
    private usageService: UsageService
  ) {
    // this.reset();
    this.classOptions = this.getClassOptions();
    this.raceOptions = this.getRaceOptions();
    this.slotOptions = this.getSlotOptions();
    this.itemTypeOptions = this.getItemTypeOptions();
    this.effectOptions = this.getEffectOptions();
  }

  ngOnInit() {
    this.usageService.send('opened item search page');
    const loadedOptionsFromUrl = this.loadOptionsFromUrl();
    if (loadedOptionsFromUrl) {
      this.items = [];
      this.hasMoreToLoad = false;
      this.search();
      return;
    }

    this.items = this.appStore.get('itemSearchItems') || [];
    this.options =
      this.appStore.get('itemSearchOptions') ||
      _.cloneDeep(this.defaultOptions);
    this.hasMoreToLoad = this.appStore.get('itemSearchHasMoreToLoad') || false;
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
    this.location.go('items');
  }

  setOptionsInUrl() {
    const optionsAsString = JSON.stringify(this.options);
    const optionsAsQueryParam = new URLSearchParams(optionsAsString).toString();
    this.location.go(`items?options=${optionsAsQueryParam}`);
  }

  ngOnDestroy() {
    this.appStore.set('itemSearchItems', this.items);
    this.appStore.set('itemSearchOptions', this.options);
    this.appStore.set('itemSearchHasMoreToLoad', this.hasMoreToLoad);
  }

  reset() {
    this.resetOptionsInUrl();
    this.options = _.cloneDeep(this.defaultOptions);
    this.hasMoreToLoad = false;
    this.items = [];
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
    const results = await this.apiService.complexItemSearch(this.options);
    this.hasMoreToLoad = results.length === this.options.size;
    if (page === 0) {
      this.items = results;
    } else {
      this.items = [...this.items, ...results];
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

  nextPage() {
    if (this.hasMoreToLoad && this.items.length) {
      this.search(this.options.page + 1);
    }
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

  getSlotOptions() {
    const allSlots = Object.keys(slotIds).map((idAsString) => {
      const id = parseInt(idAsString);
      return { label: slotIds[id], value: [id] };
    });

    // Dedupe dumb duplicate slots, like left ear / right ear
    return allSlots.reduce((dedupedSlots, slot) => {
      const existingSlot = dedupedSlots.find((s) => s.label === slot.label);
      if (existingSlot) {
        existingSlot.value.push(...slot.value);
      } else {
        dedupedSlots.push(slot);
      }
      return dedupedSlots;
    }, [] as LabelValue<number[]>[]);
  }

  getItemTypeOptions() {
    return Object.keys(itemTypes).map((keyAsString) => {
      const itemTypeId = parseInt(keyAsString);
      return { label: itemTypes[itemTypeId], value: itemTypeId };
    });
  }

  getItemType(item: Item) {
    const slots = getSlotsAsStrings(item.slots);
    if (
      item.itemtype === 0 &&
      !slots.includes('Primary') &&
      !slots.includes('Secondary') &&
      !slots.includes('Range')
    ) {
      return '';
    }
    return itemTypes[item.itemtype] || '';
  }

  getSlotsString(item: Item) {
    return getSlotsString(item.slots, true);
  }

  getEffectOptions(): LabelValue<EffectFilter>[] {
    return [
      { label: 'Haste', value: { id: 11, baseValue: 'percentPositive' } },
      {
        label: 'Runspeed',
        value: { id: 3, baseValue: 'amountPositive' },
      },
      {
        label: 'HP Regen',
        value: { id: 0, baseValue: 'amountPositive', hasDuration: true },
      },
      {
        label: 'Water Breathing',
        value: { id: 14, baseValue: 'amountPositive' },
      },
      { label: 'Illusion', value: { id: 58, baseValue: 'amountPositive' } },
      { label: 'Slow', value: { id: 11, baseValue: 'percentNegative' } },
      { label: 'Snare', value: { id: 3, baseValue: 'amountNegative' } },
      {
        label: 'Heal',
        value: { id: 0, baseValue: 'amountPositive', hasDuration: false },
      },
      {
        label: 'Damage over Time',
        value: { id: 0, baseValue: 'amountNegative', hasDuration: true },
      },
      {
        label: 'Direct Damage',
        value: { id: 0, baseValue: 'amountNegative', hasDuration: false },
      },
      // { label: 'Damage Shield', value: { id: 59, baseValue: 'amountPositive' } },
      // { label: 'Grow', value: { id: 89, baseValue: 'percentPositive' } },
      // { label: 'Shrink', value: { id: 89, baseValue: 'percentNegative' } },
      // { label: 'DoT', value: { id: 0, baseValue: 'amountNegative' } },
      // { label: 'DoT', value: { id: 0, baseValue: 'amountNegative' } },
    ];
  }

  onSort(newSort: { field: string; order: 1 | -1 }) {
    const oldSort = this.options.sort;
    this.options.sort = newSort;
    if (newSort.field !== oldSort.field || newSort.order !== oldSort.order) {
      this.items = [];
      this.search(0);
    }
  }
}
