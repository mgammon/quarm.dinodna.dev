import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FieldsetModule } from 'primeng/fieldset';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import * as _ from 'lodash';

import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';

import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ChipsModule } from 'primeng/chips';
import { LogService } from '../../../logs/log.service';

@Component({
  selector: 'app-ignore-list',
  standalone: true,
  templateUrl: './ignore-list.component.html',
  styleUrl: './ignore-list.component.scss',
  imports: [
    CommonModule,
    FieldsetModule,
    TooltipModule,
    PanelModule,
    RouterModule,
    BadgeModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AutoFocusModule,
    OverlayPanelModule,
    FloatLabelModule,
    InputTextareaModule,
    ChipsModule,
  ],
})
export class IgnoreListComponent {
  constructor(public logService: LogService) {}

  onChange() {
    this.logService.saveIgnoreList();
  }
}
