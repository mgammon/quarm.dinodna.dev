import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
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
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';
import * as moment from 'moment';
import { ChatLogComponent } from '../../auctions/chat/chat-log.component';

enum Tab {
  DropsFrom,
  SoldBy,
  Auctions,
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
    ChatLogComponent,
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
  private chart?: Chart<any>;

  @ViewChild('chart') chartElement?: ElementRef<HTMLCanvasElement>;

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

  async buildChart() {
    await this.waitForChartElement();
    if (!this.chartElement) {
      return;
    }

    let maxCount = 0;
    const sellerCounts: { x: number; y: number }[] = [];
    const buyerCounts: { x: number; y: number }[] = [];
    const mins: { x: number; y: number }[] = [];
    const maxes: { x: number; y: number }[] = [];
    const avgs: { x: number; y: number }[] = [];
    this.item.auctionSummaries?.forEach((summary) => {
      maxCount = Math.max(maxCount, summary.count);
      const date = new Date(summary.date).getTime();
      if (!summary.wts) {
        buyerCounts.push({ x: date, y: summary.count });
        return;
      } else {
        sellerCounts.push({ x: date, y: summary.count });
        avgs.push({ x: date, y: Math.round(summary.average) });
        mins.push({ x: date, y: summary.min });
        maxes.push({ x: date, y: summary.max });
      }
    });
    sellerCounts.sort((a, b) => b.x - a.x);
    buyerCounts.sort((a, b) => b.x - a.x);
    avgs.sort((a, b) => b.x - a.x);
    mins.sort((a, b) => b.x - a.x);
    maxes.sort((a, b) => b.x - a.x);

    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.chartElement.nativeElement, {
      // type: 'bar',
      options: {
        responsive: true,
        aspectRatio: 2,
        scales: {
          prices: {
            title: { text: 'Platinum', display: true },
            position: 'left',
            stacked: true,
            beginAtZero: true,
          },
          counts: {
            title: { text: 'Sellers', display: true },
            position: 'right',
            max: maxCount * 10,
            stacked: true,
          },
          x: {
            type: 'time',
            time: {
              tooltipFormat: 'MMM Do',
            },
            stacked: true,
          },
        },
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
          },
        },
      },
      data: {
        datasets: [
          {
            label: 'Average Price',
            type: 'line',
            data: avgs,
            yAxisID: 'prices',
            // segment: {
            //   borderColor: (ctx: any) => ctx.p1.raw.x.skip - ctx.p0.raw.x > DAY_IN_MS * 3 ?  'rgb(0,0,0,0.2)' : undefined,
            //   borderDash: (ctx: any) => { console.log(ctx);
            //     return ctx.p1.raw.x.skip - ctx.p0.raw.x < DAY_IN_MS * 3 ? [6, 6] : undefined;
            //   },
            // },
          },
          {
            label: 'Sellers',
            type: 'bar',
            data: sellerCounts,
            yAxisID: 'counts',
          },
          // dumb.  Adding this messes up tooltips, idk why.  I don't really like this library, prob gonna switch it out.
          // {
          //   label: 'Buyers',
          //   type: 'bar',
          //   data: buyerCounts,
          //   yAxisID: 'counts',
          // },
        ],
      },
    });
  }

  async waitForChartElement() {
    while (!this.chartElement) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
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

    this.dropsFrom = dropsFrom(this.item);
    this.soldBy = soldBy(this.item);

    this.merchantZones = this.getMerchantZones();
    this.dropZones = this.getDroppedZones();

    this.item.dailyAuctions?.forEach(
      (auction) => (auction.log.sentAt = moment(auction.log.sentAt))
    );

    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'auctions') {
      this.tabIndex = Tab.Auctions;
    } else if (this.dropsFrom.length) {
      this.tabIndex = Tab.DropsFrom;
    } else if (this.soldBy.length) {
      this.tabIndex = Tab.SoldBy;
    }

    this.buildChart();
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
