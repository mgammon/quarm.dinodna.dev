import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { TooltipModule } from 'primeng/tooltip';
import { SpellComponent } from '../spell.component/spell.component';
import { SpellNew } from '../spell.entity';

@Component({
  selector: 'app-spell-link',
  standalone: true,
  templateUrl: './spell-link.component.html',
  styleUrl: './spell-link.component.scss',
  imports: [CommonModule, RouterModule, SpellComponent, TooltipModule],
})
export class SpellLinkComponent {
  @Input()
  public spellId!: number;

  @Input()
  public spellName!: string;

  @Input()
  public spellIcon?: number;

  @Input()
  public level?: number;

  @Input()
  public levelSource?: string;

  @Input()
  public linkStyle?: boolean;

  public spell?: SpellNew;

  private loading?: boolean = undefined;

  constructor(private apiService: ApiService) {}

  async onHover() {
    if (this.loading === undefined) {
      this.loading = true;
      this.spell = await this.apiService.getSpell(this.spellId); // TODO: Get spell snippet instead?  If I'm joining a bunch of stuff on getSpell?
      this.loading = false;
    }
  }
}
