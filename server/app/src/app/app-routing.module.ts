import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemPage } from './items/item.page/item.page';
import { MapComponent } from './map/map.component';
import { NpcPage } from './npcs/npc.page';
import { SpellsPage } from './spells/spell.page';
import { ItemSearchPage } from './items/item-search.page/item-search.page';
import { NpcSearchPage } from './npcs/npc-search.page/npc-search.page';
import { ZonesPage } from './zones/zones.page';
import { ZoneDetailsPage } from './zones/zone-details.page/zone-details.page';
import { AuctionsPage } from './auctions/auctions.page';
import { CharacterComponent } from './characters/character.component';
import { InventoryPage } from './inventory/inventory.page';
import { BazaarPage } from './bazaar/bazaar.page';
import { SearchPageComponent } from './search/search-page/search-page.component';

const routes: Routes = [
  { path: 'items', component: ItemSearchPage },
  { path: 'items/:id', component: ItemPage },
  { path: 'npcs', component: NpcSearchPage },
  { path: 'npcs/:id', component: NpcPage },
  { path: 'spells/:id', component: SpellsPage },
  { path: 'maps', component: MapComponent },
  { path: '', component: AuctionsPage },
  { path: 'auctions', component: AuctionsPage },
  { path: 'zones', component: ZonesPage },
  { path: 'zones/:id', component: ZoneDetailsPage },
  { path: 'search', component: SearchPageComponent },
  { path: 'dps', component: CharacterComponent },
  { path: 'characters', component: CharacterComponent },
  { path: 'characters/:id', component: CharacterComponent },
  { path: 'inventory', component: InventoryPage },
  { path: 'bazaar', component: BazaarPage },
  { path: 'bazaar/search', component: BazaarPage }, // TODO
  { path: 'bazaar/manage', component: BazaarPage }, // TODO
  { path: 'bazaar/feed', component: BazaarPage }, // TODO
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
