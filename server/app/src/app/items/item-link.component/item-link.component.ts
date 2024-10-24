import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Item } from '../item.entity';
import { ApiService } from '../../api/api.service';
import { ItemComponent } from '../item.component/item.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-item-link',
  standalone: true,
  templateUrl: './item-link.component.html',
  styleUrl: './item-link.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    forwardRef(() => ItemComponent),
    TooltipModule,
  ],
})
export class ItemLinkComponent {
  @Input({ required: true })
  public itemId!: number;

  @Input({ required: true })
  public itemName!: string;

  @Input({ required: false })
  public itemIcon?: number;

  @Input({ required: false })
  public linkStyle?: boolean;

  @Input({ required: false })
  public subtitle?: string;

  @Input({ required: false })
  public noNav?: boolean;

  @Input({ required: false })
  public hideText?: boolean;

  public item?: Item;

  public loading?: boolean = undefined;

  constructor(private apiService: ApiService) {}

  private hoverTimeout: any;

  // Start a timeout to load the item
  async onMouseEnter() {
    // We've already loaded or started loading; no need to trigger it.
    if (this.loading !== undefined) {
      return;
    }

    // Clear existing timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    // Start a new timeout
    this.hoverTimeout = setTimeout(() => {
      this.hoverTimeout = undefined;
      this.loadItem();
    }, 150);
  }

  // Clear the existing timeout
  async onMouseLeave() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = undefined;
  }

  loadItem = async () => {
    if (this.loading === undefined) {
      this.loading = true;
      this.item = await this.apiService.getItemSnippet(this.itemId);
      this.loading = false;
    }
  };
}
