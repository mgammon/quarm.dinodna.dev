import * as _ from 'lodash';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { AutoFocusModule } from 'primeng/autofocus';
import { SplitterModule } from 'primeng/splitter';
import { ChatComponent } from './chat/chat.component';

import { FormsModule } from '@angular/forms';
import { TrackerComponent } from './tracker/tracker.component';
import { UsageService } from '../usage.service';

@Component({
  selector: 'app-auctions-page',
  standalone: true,
  templateUrl: './auctions.page.html',
  styleUrl: './auctions.page.scss',
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
    ChatComponent,
    TrackerComponent,
    SplitterModule,
  ],
})
export class AuctionsPage {
  constructor(private usageService: UsageService) {}

  ngOnInit() {
    this.usageService.send('opened auction page');
  }
}
