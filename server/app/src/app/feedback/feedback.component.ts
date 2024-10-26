import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../api/api.service';
import { FieldsetModule } from 'primeng/fieldset';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import * as _ from 'lodash';

import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';

import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-feedback',
  standalone: true,
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss',
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
  ],
})
export class FeedbackComponent {
  public feedback = { name: '', message: '' };
  public sending?: boolean;

  constructor(private apiService: ApiService) {}

  reset(overlayPanel?: OverlayPanel) {
    if (this.sending) {
      return;
    }
    this.feedback = { name: '', message: '' };
    this.sending = undefined;
    if (overlayPanel) {
      overlayPanel.hide();
    }
  }

  async send() {
    if (this.sending !== undefined) {
      return;
    }
    this.sending = true;
    if (this.feedback && this.feedback.message) {
      await this.apiService.sendFeedback(this.feedback);
    }
    this.sending = false;
  }
}
