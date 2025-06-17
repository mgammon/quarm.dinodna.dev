import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { FieldsetModule } from 'primeng/fieldset';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import * as _ from 'lodash';

import { CheckboxModule } from 'primeng/checkbox';
import { TriStateCheckboxModule } from 'primeng/tristatecheckbox';
import { FormsModule } from '@angular/forms';

import { DividerModule } from 'primeng/divider';

import { ButtonModule } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';
import { CardModule } from 'primeng/card';
import { AppStore } from '../app-store.service';
import { ApiService } from '../api/api.service';
import { UsageService } from '../usage.service';

@Component({
  selector: 'app-bazaar-page',
  standalone: true,
  templateUrl: './bazaar.page.html',
  styleUrl: './bazaar.page.scss',
  imports: [
    CommonModule,
    TabViewModule,
    CardModule,
    FieldsetModule,
    TooltipModule,
    PanelModule,
    TableModule,
    DividerModule,
    RouterModule,
    CheckboxModule,
    TriStateCheckboxModule,
    FormsModule,
    MultiSelectModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    ButtonModule,
    AutoFocusModule,
    CardModule,
  ],
})
export class BazaarPage implements OnInit {
  constructor(
    private apiService: ApiService,
    private appStore: AppStore,
    private usageService: UsageService
  ) {
    // this.reset();
  }

  ngOnInit() {
    this.usageService.send('opened bazaar page');
  }

  ngOnDestroy() {}
}
