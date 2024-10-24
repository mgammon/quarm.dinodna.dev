import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Item } from './items/item.entity';
import { Npc } from './npcs/npc.entity';
import { SpellNew } from './spells/spell.entity';
import { Zone } from './zones/zone.entity';

interface PageInfo {
  entity: Partial<Item | Npc | SpellNew | Zone>;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  recentPages: PageInfo[] = [];

  constructor(private router: Router) {
    this.loadRecentPages();
  }

  //   goTo(pageInfo: PageInfo) {
  //     this.addToRecentPages(pageInfo);
  //     this.router.navigateByUrl(pageInfo.url);
  //   }

  private loadRecentPages() {
    this.recentPages = JSON.parse(localStorage.getItem('recentPages') || '[]');
  }

  // I should refactor this so the entities are more strict
  // I've run into circular JSON and missing properties so far.
  public addToRecentPages(pageInfo: PageInfo) {
    // Remove this page from the list (if it's already on the list)
    this.recentPages = this.recentPages.filter(
      (page) => page.url !== pageInfo.url
    );
    // Add the page to the top of the list
    this.recentPages.unshift(pageInfo);
    this.save();
    // localStorage.setItem('recentPages', JSON.stringify(this.recentPages));
  }

  save() {
    // Don't save more than the last 50 items
    if (this.recentPages.length > 50) {
      this.recentPages.pop();
    }
    // Buuut if we filled up the local storage key somehow, we'll try popping items off until we can fit this most recent item
    for (let i = 0; i < 50; i++) {
      try {
        localStorage.setItem('recentPages', JSON.stringify(this.recentPages));
        return;
      } catch (ex) {
        console.log(ex);
        this.recentPages.pop();
      }
    }
  }
}
