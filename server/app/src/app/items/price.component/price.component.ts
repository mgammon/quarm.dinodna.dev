import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price.component.html',
  styleUrl: './price.component.scss',
})
export class PriceComponent {
  @Input({ required: true })
  public price!: number;

  @Input({ required: false })
  label?: string;

  @Input({ required: false })
  noZeroes?: boolean;

  get platinum() {
    return Math.floor(this.price / 1000);
  }

  get gold() {
    return Math.floor((this.price % 1000) / 100);
  }

  get silver() {
    return Math.floor((this.price % 100) / 10);
  }

  get copper() {
    return Math.floor(this.price % 10);
  }
}
