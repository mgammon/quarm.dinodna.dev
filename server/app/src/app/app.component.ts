import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
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
// import { LogReaderService } from './logs/log-reader.service';
import { LocationService } from './logs/location.service';
import { ApiService } from './api/api.service';
import { BadgeModule } from 'primeng/badge';
import { FeedbackComponent } from './feedback/feedback.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Log } from './logs/log.entity';
import { TrackerService } from './auctions/tracker/tracker.service';
import * as moment from 'moment';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SearchPageComponent } from './search/search-page/search-page.component';

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
    BadgeModule,
    FeedbackComponent,
    ToastModule,
    TagModule,
  ],
  providers: [MessageService, DialogService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements OnInit {
  title = 'app';
  public themeMenuOptions = this.getThemeMenuOptions();
  @ViewChild('recentMenu') recentMenuAny?: any;

  apiKey: string | null;

  public mostRecentSystemLog?: Log;

  public veliousLaunchDate = moment('2025-04-01T15:00:00-04:00');

  public liveButtonClass: string = 'yellow';
  // public showSetEqDirectory = (window as any).showDirectoryPicker;

  public searchDialog?: DynamicDialogRef<SearchPageComponent>;

  constructor(
    public navigationService: NavigationService,
    public themeService: ThemeService,
    public logService: LogService,
    public apiService: ApiService,
    public locationService: LocationService,
    private router: Router,
    // public logReaderService: LogReaderService,
    public messageService: MessageService,
    public trackerService: TrackerService,
    public dialogService: DialogService,
  ) {
    this.apiKey = this.apiService.apiKey + '';
    logService.logEvents.subscribe((logs) => {
      const systemLogs = logs.filter((log) => log.channel === 'system');
      const mostRecentSystemLog = systemLogs[systemLogs.length - 1];
      if (mostRecentSystemLog) {
        this.onSystemLog(mostRecentSystemLog);
      }
    });
  }

  openSearchDialog() {
    if (this.searchDialog) {
      return;
    }

    this.searchDialog = this.dialogService.open(SearchPageComponent, {
      style: { width: '100%', minHeight: '600px', maxHeight: '600px', maxWidth: '1025px' },
      contentStyle: {
        overflowY: 'hidden'
      },
      showHeader: false,
    });
    const onCloseSubscription = this.searchDialog.onClose.subscribe(() => {
      onCloseSubscription.unsubscribe();
      this.searchDialog = undefined;
    });
  }

  ngOnInit(): void {
    addEventListener('keydown', (event: KeyboardEvent) => {
      if ((event.key === 'k' && event.ctrlKey) || event.key === '/') {
        event.preventDefault();
        this.openSearchDialog();
      }
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Navigation starting
        if (this.searchDialog) {
          this.searchDialog.close();
        }
      }
    });
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
        `/zones/${this.locationService.currentLocation.zoneId}?autoLoadZone=true`,
      );
    }
  }

  // async openDirectoryPicker() {
  //   if (!(window as any).showDirectoryPicker) {
  //     return;
  //   } else {
  //     const directory = await (window as any).showDirectoryPicker();
  //     this.logReaderService.setDirectory(directory);
  //   }
  // }

  onSystemLog = (log: Log) => {
    if ((this.mostRecentSystemLog?.sentAt.unix() || 0) < log.sentAt.unix()) {
      if (this.mostRecentSystemLog) {
        this.messageService.clear(this.mostRecentSystemLog.id.toString());
      }
      this.mostRecentSystemLog = log;
    }
    this.messageService.clear();
    this.messageService.add({
      severity: 'warn',
      summary: '[SYSTEM]',
      detail: log.text,
      life: 59_000,
    });
    this.trackerService.playAlert(log);
  };

  changeApiKey() {
    if (this.apiKey) {
      this.apiService.changeApiKey(this.apiKey);
      location.reload();
    }
  }
}
