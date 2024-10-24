import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-item-snippet',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-snippet.component.html',
  styleUrl: './item-snippet.component.scss',
})
export class ItemSnippet {
  @Input()
  public itemId!: number;
  @Input()
  public itemIcon!: number;
  @Input()
  public itemName!: string;
}
