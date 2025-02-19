import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as moment from 'moment';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss'],
  standalone: true,
  imports: [FormsModule, TooltipModule],
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  title!: string;

  @Input({ required: false })
  tooltip?: string;

  @Input({ required: true })
  date!: moment.Moment;

  public days?: number;
  public hours?: number;
  public minutes?: number;
  public seconds?: number;

  private refreshInterval: any;

  ngOnInit(): void {
    this.refresh();
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

  refresh() {
    try {
      const msUntilDate = this.date.diff(moment());
      this.days = Math.floor(msUntilDate / (1000 * 60 * 60 * 24));
      this.hours = Math.floor(msUntilDate / (1000 * 60 * 60)) - this.days * 24;
      this.minutes =
        Math.floor(msUntilDate / (1000 * 60)) -
        this.days * 24 * 60 -
        this.hours * 60;
      this.seconds =
        Math.floor(msUntilDate / 1000) -
        this.days * 24 * 60 * 60 -
        this.hours * 60 * 60 -
        this.minutes * 60;
    } catch (ex) {
      // Don't kill the site for a dumb countdown
    }

  }
}
