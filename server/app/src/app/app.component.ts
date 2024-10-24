import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChatComponent } from './auctions/chat/chat.component';
import { MapComponent } from './map/map.component';
import { ButtonModule } from 'primeng/button';
import { SearchComponent } from './search/search.component';
import { ToolbarModule } from 'primeng/toolbar';
import { NavigationService } from './navigation.service';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { ResultComponent } from './search/result.component/result.component';
import { ThemeService } from '../themes/theme.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { LogService } from './logs/log.service';
import { FormsModule } from '@angular/forms';
import { LogReaderService } from './logs/log-reader.service';
import { LocationService } from './logs/location.service';
import { ApiService } from './api/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    ScrollingModule,
    ChatComponent,
    MapComponent,
    ButtonModule,
    ToolbarModule,
    SearchComponent,
    CommonModule,
    MenuModule,
    ResultComponent,
    OverlayPanelModule,
    InputTextModule,
    InputGroupModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
  title = 'app';
  public themeMenuOptions = this.getThemeMenuOptions();
  @ViewChild('recentMenu') recentMenuAny?: any;

  apiKey: string | null;

  public liveButtonClass: string = 'yellow';

  constructor(
    public navigationService: NavigationService,
    public themeService: ThemeService,
    public logService: LogService,
    public apiService: ApiService,
    public locationService: LocationService,
    private router: Router,
    public logReaderService: LogReaderService
  ) {
    this.apiKey = this.apiService.apiKey + '';
  }

  getThemeMenuOptions() {
    return this.themeService.themes.map((theme) => ({
      label: theme.label,
      command: () => this.themeService.switchTheme(theme.value),
    }));
  }

  goToLiveMap() {
    if (this.locationService.currentLocation.zoneId) {
      this.router.navigateByUrl(
        `/zones/${this.locationService.currentLocation.zoneId}?autoLoadZone=true`
      );
    }
  }

  async openDirectoryPicker() {
    if (!(window as any).showDirectoryPicker) {
      return;
    } else {
      const directory = await (window as any).showDirectoryPicker();
      this.logReaderService.setDirectory(directory);
    }
  }
}
