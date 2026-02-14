import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  signal,
} from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { throttle } from '../../utils';
import { ResultComponent } from '../result.component/result.component';
import { SearchableEntity, SearchService } from '../search.service';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-page',
  standalone: true,
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ResultComponent,
    InputTextModule,
  ],
})
export class SearchPageComponent {
  public query?: string;
  public results = signal<SearchableEntity[]>([]);

  public columnCount = signal(1);

  public selectedIndex = signal(0);

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    this.setNumberOfColumns();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setNumberOfColumns();
  }

  setNumberOfColumns() {
    const columnCount = Math.floor((window.innerWidth - 16) / 312);
    this.columnCount.set(Math.min(columnCount, 3));
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const { key } = event;
    if (key === 'Enter') {
      const selectedIndex = this.selectedIndex() || 0;
      const entity = this.results()[selectedIndex];
      if (entity) {
        this.onSelect(entity);
      } else {
        this.selectedIndex.set(0);
      }
    } else if (key === 'ArrowUp') {
      const selectedIndex = this.selectedIndex() - this.columnCount();
      this.selectedIndex.set(Math.max(selectedIndex, 0));
    } else if (key === 'ArrowDown') {
      const maxSelectedIndex = this.results().length - 1;
      const selectedIndex = this.selectedIndex() + this.columnCount();
      this.selectedIndex.set(Math.min(selectedIndex, maxSelectedIndex));
    } else if (key === 'ArrowLeft') {
      const selectedIndex = this.selectedIndex() - 1;
      this.selectedIndex.set(Math.max(selectedIndex, 0));
    } else if (key === 'ArrowRight') {
      const maxSelectedIndex = this.results().length - 1;
      const selectedIndex = this.selectedIndex() + 1;
      this.selectedIndex.set(Math.min(selectedIndex, maxSelectedIndex));
    }
  }

  search = throttle(250, async () => {
    this.selectedIndex.set(0);

    if (!this.query || this.query.length < 2) {
      if (this.results().length > 0) {
        this.results.set([]);
      }
      return;
    }

    this.results.set(await this.searchService.search(this.query, 30));
  });

  onSelect(entity: SearchableEntity) {
    this.searchService.navigateToEntity(entity);
  }
}
