import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { ApiService } from '../api/api.service';
import { NavigationService } from '../navigation.service';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { MapComponent } from '../map/map.component';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { PriceComponent } from '../items/price.component/price.component';
import { DividerModule } from 'primeng/divider';
import { SpellNew } from './spell.entity';
import { SpellComponent } from './spell.component/spell.component';
import { ItemLinkComponent } from "../items/item-link.component/item-link.component";

@Component({
    selector: 'app-spell-page',
    standalone: true,
    templateUrl: './spell.page.html',
    styleUrl: './spell.page.scss',
    imports: [
        CommonModule,
        TabViewModule,
        MapComponent,
        CardModule,
        FieldsetModule,
        TooltipModule,
        PanelModule,
        TableModule,
        PriceComponent,
        DividerModule,
        RouterModule,
        SpellComponent,
        ItemLinkComponent
    ]
})
export class SpellsPage {
  public spellId?: number;
  public spell!: SpellNew;

  public tabIndex!: number;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private navigationService: NavigationService,
    public router: Router
  ) {
    this.route.params.subscribe(this.initializePage);
  }

  initializePage = async (params: Params) => {
    this.spellId = parseInt(params['id']);
    if (!Number.isInteger(this.spellId)) {
      throw new Error('Bad NPC ID');
    }

    this.spell = await this.apiService.getSpell(this.spellId);
    this.navigationService.addToRecentPages({
      entity: this.spell,
      url: `spells/${this.spell.id}`,
    });

    if (this.spell.scrollItems.length > 0) {
      this.tabIndex = 3;
    } else if (this.spell.clickItems.length > 0) {
      this.tabIndex = 0;
    } else if (this.spell.wornItems.length > 0 ) {
      this.tabIndex = 1;
    } else if (this.spell.procItems.length > 0) {
      this.tabIndex = 2;
    }

    console.log(this.spell);
  };
}
