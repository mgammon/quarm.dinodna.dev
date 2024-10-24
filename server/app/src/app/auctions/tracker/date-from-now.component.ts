import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as moment from 'moment';

moment.updateLocale('en', {
  relativeTime: {
    s: '%ds',
    ss: '%ds',
    m: '%dm',
    mm: '%dm',
    h: '%dh',
    hh: '%dh',
  },
});

@Component({
  selector: 'app-date-from-now',
  standalone: true,
  templateUrl: './date-from-now.component.html',
  imports: [CommonModule],
})
export class DateFromNowComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  date!: moment.Moment;

  @Input({ required: false })
  style?: string;

  dateFromNow!: string;
  private updateInterval: any;

  ngOnInit(): void {
    this.setDateFromNow();
    this.updateInterval = setInterval(this.setDateFromNow, 15_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.updateInterval);
  }

  setDateFromNow = () => {
    this.dateFromNow = moment(this.date).fromNow();
  };
}
