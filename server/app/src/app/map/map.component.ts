import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { ApiService } from '../api/api.service';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { Npc, Spawn } from '../npcs/npc.entity';
import { allClasses } from '../api/classes';
import { allZones, zoneMap } from '../zones/zone.entity';
import { formatSeconds } from '../utils';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MapStore } from './map.service';
import { LogService } from '../logs/log.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { LocationService } from '../logs/location.service';
import * as moment from 'moment';

const ZONE_LINE_SVG = `<svg class="zone-line" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/></svg>`;

enum MapElementType {
  Line = 'L',
  Point = 'P',
}

const brewallCrs = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(1, 0, 1, 0),
});

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    SliderModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent {
  @Input({ required: false })
  hideHeader: boolean = false;

  @Input({ required: true })
  zoneShortName!: string;

  @Input()
  spawns?: Spawn[] = [];

  @Input()
  onZRangeChange?: (zRange: [number, number]) => void;

  @Input()
  markedNpcIds?: number[];

  markedSpawnIds?: number[];

  @Input()
  hideControls?: boolean;

  private mapfile?: string;

  private map!: L.Map;

  public mouseCoords?: L.LatLng;

  public error?: boolean;

  public currentLocationMarker?: L.Marker<L.DivIcon>;
  public liveButtonClass = 'red';

  public showLocationAnyhow = false;

  public zoneFullName?: string;

  public zRangeTimesTen: number[] = [-100, 100];
  public minZTimesTen = -100;
  public maxZTimesTen = 100;

  private zLayers: {
    minZ: number;
    maxZ: number;
    enabled: boolean;
    mapGroup: L.LayerGroup;
    spawnGroup: L.LayerGroup;
  }[] = [];

  constructor(
    public apiService: ApiService,
    public locationService: LocationService,
    public logService: LogService,
    private mapStore: MapStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.locationService.locationEvents.subscribe(() => {
      this.updateCurrentLocation();
      this.setLiveButtonClass();
    });

    this.mapStore.markedSpawnIds.subscribe((markedSpawnIds) => {
      this.markedSpawnIds = markedSpawnIds;
      if (this.map) {
        this.clearSpawns();
        this.addSpawns();
      }
    });

    this.updateRespawnTimers();

    this.route.queryParams.subscribe((queryParams) => {
      const autoLoadZone = queryParams['autoLoadZone'];
      this.locationService.autoLoadZone = autoLoadZone === 'true';
    });
    this.locationService.autoLoadZone =
      window.location.href.includes('autoLoadZone=true'); // idk if this is needed anymore.
  }

  toggleAutoCenter() {
    this.locationService.autoCenter = !this.locationService.autoCenter;
  }

  toggleAutoLoadZone() {
    const url = window.location.href;
    if (url.includes('zones/')) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { autoLoadZone: !this.locationService.autoLoadZone },
        queryParamsHandling: 'merge',
      });
    }
  }

  setLiveButtonClass(): string {
    const { zoneId, updatedAt } = this.locationService.currentLocation;
    // No location or zone, danger
    if (!zoneId) {
      return (this.liveButtonClass = 'red');
    }

    // Older than 5 minutes, warning
    const timeSinceLastUpdate = Date.now() - (updatedAt || 0);
    if (timeSinceLastUpdate > 60_000 * 5) {
      return (this.liveButtonClass = 'yellow');
    }

    // Otherwise, good to go
    return (this.liveButtonClass = 'green');
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes['zoneShortName'] &&
      changes['zoneShortName'].currentValue !==
        changes['zoneShortName'].previousValue
    ) {
      try {
        if (!this.zoneShortName) {
          throw new Error('No zone name given');
        }
        const fileName = await this.getZoneFileName(this.zoneShortName);
        this.zoneFullName = await this.getZoneFullName(this.zoneShortName);
        this.mapfile = await this.apiService.getMapfile(fileName);
        if (!this.map) {
          this.initializeMap();
        } else {
          this.clearSpawns();
          this.clearMap();
        }
        // Process the mapfile and add spawns
        this.processMapFile(this.mapfile);
        this.addSpawns();
        // this.updateCurrentLocation(this.liveService.currentLocation.value);
      } catch (ex) {
        console.log(ex);
        this.clearMap();
        this.clearSpawns();
        this.error = true;
      }
    } else if (changes['spawns']) {
      // If the map didn't change, but the spawns did, keep the map, but redo the spawns
      this.clearSpawns();
      this.addSpawns();
    }
  }

  // lol same thing
  internalToEqCoords = (internal: L.LatLng) =>
    new L.LatLng(internal.lat * -100, internal.lng * -100);
  eqCoordsToInternal = (eq: L.LatLng) =>
    new L.LatLng(eq.lng / -100, eq.lat / -100, (eq.alt || 0) / 100);
  displayCoords = (internal: L.LatLng) => {
    const coords = this.internalToEqCoords(internal);
    return new L.LatLng(Math.round(coords.lat), Math.round(coords.lng));
  };

  initializeMap() {
    // Initialize the Map
    this.map = L.map('map', {
      crs: brewallCrs,
      maxBounds: [
        [-5000, -1000],
        [1000, 1000],
      ],
      minZoom: 2,
      maxZoom: 10,
      zoomControl: this.hideControls !== true,
      zoom: 3,
      attributionControl: false,
      // renderer: L.canvas({ padding: 100})
    });
    this.map.project;
    this.map.setView([0, 0]);
    // Zoom: 4 = 3200-3200 across
    // Zoom: 5 = ~1600 across

    // Adding renderer padding so things don't clip when panning
    const renderer = L.canvas({ padding: 100 });
    this.map.getRenderer(renderer as L.Path).options.padding = 100;

    // Add event listeners
    this.map.on('mousemove', (event) => {
      this.mouseCoords = this.displayCoords(event.latlng);
    });
    this.map.on('mouseout', (event) => {
      this.mouseCoords = undefined;
    });
    this.map.on('zoomanim', (idk) => this.onZoomEnd(idk));

    this.initializeZLayers();
    this.updateCurrentLocation();
  }

  // Remove all the layers from each zLayer group
  clearMap() {
    this.zLayers.forEach((zLayer) => {
      zLayer.mapGroup.clearLayers();
    });
  }

  clearSpawns() {
    this.zLayers.forEach((zLayer) => {
      zLayer.spawnGroup.clearLayers();
    });
  }

  addSpawns() {
    this.spawns?.forEach((spawn) => this.addSpawn(spawn));
  }

  shouldShowMapOptions() {
    return window.location.href.includes('zones/');
  }

  updateCurrentLocation() {
    const { coords, zoneId, heading } = this.locationService.currentLocation;
    // No longer on this map
    if (zoneId !== this.zoneShortName && !this.showLocationAnyhow) {
      if (this.currentLocationMarker) {
        this.currentLocationMarker.removeFrom(this.map);
      }

      // Auto load the next zone
      if (
        zoneId &&
        this.locationService.autoLoadZone &&
        window.location.href.includes('zones/')
      ) {
        this.router.navigateByUrl(
          `/zones/${zoneId}?autoLoadZone=${this.locationService.autoLoadZone}`
        );
      }
      return;
    }

    // Or don't have coords
    if (!coords || !this.map) {
      return;
    }

    const mapCoords = this.eqCoordsToInternal(
      new L.LatLng(coords.x, coords.y, coords.z)
    );

    if (this.currentLocationMarker) {
      if (!this.map.hasLayer(this.currentLocationMarker)) {
        this.currentLocationMarker.addTo(this.map);
      }

      this.currentLocationMarker.setLatLng(mapCoords);
      const element = document.querySelector('.current-location') as any;
      if (element) {
        element.style = `transform: rotate(${((heading || 0) + 225) % 360}deg)`;
      }
    } else {
      this.currentLocationMarker = new L.Marker<L.DivIcon>(mapCoords, {
        icon: new L.DivIcon({
          className: 'none static-size',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          html: `<svg xmlns="http://www.w3.org/2000/svg" class="current-location" viewBox="0 0 448 512"><path d="M429.6 92.1c4.9-11.9 2.1-25.6-7-34.7s-22.8-11.9-34.7-7l-352 144c-14.2 5.8-22.2 20.8-19.3 35.8s16.1 25.8 31.4 25.8H224V432c0 15.3 10.8 28.4 25.8 31.4s30-5.1 35.8-19.3l144-352z"/></svg>`,
        }),
      });
      this.currentLocationMarker.addTo(this.map);
    }

    if (
      this.locationService.autoCenter &&
      window.location.href.includes('zones/')
    ) {
      this.map.panTo(mapCoords);
    }
  }

  processMapFile(mapfile: string) {
    const min = new L.LatLng(Infinity, Infinity, Infinity);
    const max = new L.LatLng(-Infinity, -Infinity, -Infinity);

    const lines = mapfile.split('\n');
    lines.forEach((line) => {
      const [lineType] = line.split(/\s+/);
      if (lineType === MapElementType.Line) {
        const points = this.addLine(line);
        min.lat = Math.min(min.lat, ...points.map((p) => p.lat));
        min.lng = Math.min(min.lng, ...points.map((p) => p.lng));
        min.alt = Math.min(
          min.alt as number,
          ...points.map((p) => p.alt as number)
        );
        max.lat = Math.max(max.lat, ...points.map((p) => p.lat));
        max.lng = Math.max(max.lng, ...points.map((p) => p.lng));
        max.alt = Math.max(
          max.alt as number,
          ...points.map((p) => p.alt as number)
        );
      } else if (lineType === MapElementType.Point) {
        this.addPoint(line);
      }
    });
    const minMaxBounds: L.LatLngBoundsExpression = [
      [min.lat, min.lng],
      [max.lat, max.lng],
    ];
    const center = new L.LatLng(
      (max.lat + min.lat) / 2,
      (max.lng + min.lng) / 2
    );
    this.map.panTo(center, { animate: false });
    this.map.fitBounds(minMaxBounds);

    // The times ten stuff is real dumb, but JS didn't wanna always round even with dumb methods
    // and primeng's slider was NOT a fan of the weird decimal places.  x10 lets me use integers on the slider.
    this.minZTimesTen = Math.round((min.alt as number) * 10) - 3;
    this.maxZTimesTen = Math.round((max.alt as number) * 10) + 3;
    this.zRangeTimesTen = [this.minZTimesTen, this.maxZTimesTen];

    this.onZRangeInputChange();
  }

  initializeZLayers() {
    this.zLayers = [];
    for (let i = -10; i <= 10; i = i + 0.1) {
      const spawnGroup = new L.LayerGroup();
      const mapGroup = new L.LayerGroup();
      spawnGroup.addTo(this.map);
      mapGroup.addTo(this.map);
      this.zLayers.push({
        minZ: i,
        maxZ: i + 0.1,
        spawnGroup,
        mapGroup,
        enabled: true,
      });
    }
  }

  onZRangeInputChange() {
    let visibleCount = 0;
    this.zLayers.forEach((zLayer) => {
      const shouldBeVisible =
        zLayer.minZ >= this.zRangeTimesTen[0] / 10 &&
        zLayer.maxZ < this.zRangeTimesTen[1] / 10;
      if (shouldBeVisible) {
        visibleCount++;
      }
      if (shouldBeVisible !== zLayer.enabled) {
        zLayer.enabled = shouldBeVisible;
        if (shouldBeVisible) {
          zLayer.mapGroup.addTo(this.map);
          zLayer.spawnGroup.addTo(this.map);
        } else {
          zLayer.mapGroup.removeFrom(this.map);
          zLayer.spawnGroup.removeFrom(this.map);
        }
      }
    });
    if (this.onZRangeChange) {
      this.onZRangeChange([
        this.zRangeTimesTen[0] * 10,
        this.zRangeTimesTen[1] * 10,
      ]);
    }
  }

  addLine(line: string) {
    const [_lineType, y2, x2, z2, y1, x1, z1, r, g, b] = line.split(/\s+/);
    const coord1 = new L.LatLng(
      parseFloat(x1) / 100,
      parseFloat(y1) / 100,
      parseFloat(z1) / 100
    );
    const coord2 = new L.LatLng(
      parseFloat(x2) / 100,
      parseFloat(y2) / 100,
      parseFloat(z2) / 100
    );

    const polyline = L.polyline([coord1, coord2], {
      color: this.rgbToHex(r, g, b),
      weight: 1,
      lineCap: 'butt',
      noClip: true,
      interactive: false,
    });

    const avgZ = ((coord1.alt as number) + (coord2.alt as number)) / 2;
    this.addToZLayer(polyline, avgZ, 'map');

    return [coord1, coord2];
  }

  addToZLayer(layer: L.Layer, avgZ: number, type: 'map' | 'spawn') {
    const zLayer = this.zLayers.find(
      (zLayer) => avgZ >= zLayer.minZ && avgZ < zLayer.maxZ
    );
    if (zLayer) {
      layer.addTo(type === 'map' ? zLayer.mapGroup : zLayer.spawnGroup);
    } else {
      // console.log('No matching Z Layer Group.  Adding to map.');
      layer.addTo(this.map);
    }
  }

  addPoint(line: string) {
    const [_lineType, y, x, z, r, g, b, idk, label] = line.split(/\s+/);
    const allowedStarts = [
      'to_',
      'TRAP:_',
      'Fake_',
      'Spikes',
      'Locked_Door',
      'Ramp_',
      'Hidden_Door',
      'Teleport',
      'Succor',
      'Pit_',
      'Pottery_Wheel',
      'Forge',
      'Kiln',
      'Loom',
      'Brewing_Barrel',
      'Oven',
      'City_Door_',
      'Bank',
      'Druid_Ring',
      'Ship',
      'Dock_',
      'Wizard_Spire',
      'Lift',
    ];
    if (
      label.length > 1 &&
      !allowedStarts.some((start) => label.startsWith(start))
    ) {
      return;
    }

    const cleanedUpLabel =
      label.charAt(0).toUpperCase() +
      label.slice(1).replaceAll('_', ' ').trim();

    const isZoneline =
      cleanedUpLabel.startsWith('To ') &&
      this.findMatchingZoneId(cleanedUpLabel);
    const zoneShortCode = isZoneline
      ? this.findMatchingZoneId(cleanedUpLabel)
      : null;
    const zoneLineHtml = isZoneline
      ? `<div style="display:inline-block; width: 16px; height:16px;">${ZONE_LINE_SVG}</div>`
      : '';

    const coord = new L.LatLng(
      parseFloat(x) / 100,
      parseFloat(y) / 100,
      parseFloat(z) / 100
    );
    const labelIcon = new L.DivIcon({
      html: `<div class="map-label-container"><span class="map-label">${cleanedUpLabel}</span>${zoneLineHtml}</div>`,
      className: 'leaflet-label-icon static-size',
      iconSize: [200, 50],
      iconAnchor: [100, 25],
    });
    // labelIcon.addEventListener('click', () =>
    //   this.router.navigateByUrl(`/zones/${zoneShortCode}`)
    // );
    const marker = new L.Marker(coord, {
      icon: labelIcon,
    });
    marker.on('click', () =>
      this.router.navigateByUrl(`/zones/${zoneShortCode}`)
    );

    this.addToZLayer(marker, coord.alt as number, 'map');
  }

  addSpawn(spawn: Spawn) {
    const coords = this.eqCoordsToInternal(
      new L.LatLng(spawn.x, spawn.y, spawn.z)
    );
    const isStaticSize = this.getIsStaticSize(spawn);
    const isMarked = this.markedSpawnIds?.includes(spawn.id);
    const icon = new L.DivIcon({
      className: `none ${isStaticSize ? 'static-size' : ''} ${
        isMarked ? 'marked-spawn' : ''
      }`,
      iconSize: isStaticSize ? [16, 16] : this.getIconSize(),
      iconAnchor: isStaticSize ? [8, 8] : this.getIconAnchor(),
      html: this.getNpcIcon(spawn),
    });
    const marker = new L.Marker(coords, {
      icon,
    });
    const npcs = spawn.spawnGroup.entries
      .map((entry) => {
        const isMarkedNpc = this.markedNpcIds?.includes(entry.npc.id);
        const level =
          entry.npc.level !== entry.npc.maxlevel
            ? `${entry.npc.level} - ${entry.npc.maxlevel}`
            : entry.npc.level;
        return `<div style="background-color:${
          isMarkedNpc ? 'lightgreen' : 'inherit'
        }">
            <a style="font-weight:${
              isMarkedNpc ? 'bold' : 'normal'
            };" href='npcs/${entry.npc.id}'>${entry.npc.name}</a> (${
          entry.chance
        }%)<br />
            <span>Level ${level} ${this.getClass(entry.npc)}</span>
          </div>`;
      })
      .join('');
    const spawnHtml = `<div>
      ${formatSeconds(spawn.respawntime)} respawn
      <hr />
      ${npcs}
    </div>`;
    marker.bindPopup(spawnHtml, { autoPan: false });
    marker.bindTooltip(spawnHtml, { direction: 'top' });
    marker.on('click', (event) => {
      if (!event.originalEvent.ctrlKey) {
        return;
      }

      event.target.closePopup();

      const respawnsAt = moment().add(spawn.respawntime, 'seconds').valueOf();
      const respawnIcon = new L.DivIcon({
        html: `<div class="map-label-countdown">${formatSeconds(
          spawn.respawntime
        )}</div>`,
        className: 'leaflet-label-icon static-size',
        iconSize: [70, 50],
        iconAnchor: [35, 30],
      });
      const respawnMarker = new L.Marker(coords, {
        icon: respawnIcon,
      });
      respawnMarker.on('click', () => {
        if (!event.originalEvent.ctrlKey) {
          return;
        }

        this.respawns = this.respawns.filter(
          (respawn) => respawn.respawnsAt > Date.now()
        );
        respawnMarker.remove();
      });
      this.respawns.push({ marker: respawnMarker, respawnsAt });
      this.addToZLayer(respawnMarker, coords.alt as number, 'spawn');
    });
    this.addToZLayer(marker, coords.alt as number, 'spawn');
  }

  updateRespawnTimers() {
    setInterval(() => {
      this.respawns.forEach((respawn) => {
        const secondsUntilRespawn = Math.floor(
          (respawn.respawnsAt - Date.now()) / 1000
        );
        if (secondsUntilRespawn > 0) {
          const html = `<div class="map-label-countdown">${formatSeconds(
            secondsUntilRespawn
          )}</div>`;
          const icon = respawn.marker.getIcon() as L.DivIcon;
          icon.options.html = html;
          // (respawn.marker.getIcon() as L.DivIcon).options.html = html;
          respawn.marker.setIcon(icon);
        } else {
          respawn.marker.remove();
        }
      });
      this.respawns = this.respawns.filter(
        (respawn) => respawn.respawnsAt > Date.now()
      );
    }, 1000);
  }

  private respawns: { marker: L.Marker; respawnsAt: number }[] = [];

  getIsStaticSize(spawn: Spawn) {
    if (spawn.spawnGroup.entries.length === 1) {
      const npc = spawn.spawnGroup.entries[0].npc;
      if (
        (npc.class >= 20 && npc.class <= 35) ||
        npc.class === 41 ||
        npc.class === 40
      ) {
        return true;
      }
    }
    return false;
  }

  getNpcIcon(spawn: Spawn, isDead?: boolean) {
    const deadClass = isDead ? 'dead-' : '';
    let html = `<svg class="${deadClass}mob" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path str d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>`;
    if (spawn.spawnGroup.entries.length === 1) {
      const npc = spawn.spawnGroup.entries[0].npc;
      if (npc.class === 41) {
        html = `<svg class="merchant" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M320 96H192L144.6 24.9C137.5 14.2 145.1 0 157.9 0H354.1c12.8 0 20.4 14.2 13.3 24.9L320 96zM192 128H320c3.8 2.5 8.1 5.3 13 8.4C389.7 172.7 512 250.9 512 416c0 53-43 96-96 96H96c-53 0-96-43-96-96C0 250.9 122.3 172.7 179 136.4l0 0 0 0c4.8-3.1 9.2-5.9 13-8.4zm84 88c0-11-9-20-20-20s-20 9-20 20v14c-7.6 1.7-15.2 4.4-22.2 8.5c-13.9 8.3-25.9 22.8-25.8 43.9c.1 20.3 12 33.1 24.7 40.7c11 6.6 24.7 10.8 35.6 14l1.7 .5c12.6 3.8 21.8 6.8 28 10.7c5.1 3.2 5.8 5.4 5.9 8.2c.1 5-1.8 8-5.9 10.5c-5 3.1-12.9 5-21.4 4.7c-11.1-.4-21.5-3.9-35.1-8.5c-2.3-.8-4.7-1.6-7.2-2.4c-10.5-3.5-21.8 2.2-25.3 12.6s2.2 21.8 12.6 25.3c1.9 .6 4 1.3 6.1 2.1l0 0 0 0c8.3 2.9 17.9 6.2 28.2 8.4V424c0 11 9 20 20 20s20-9 20-20V410.2c8-1.7 16-4.5 23.2-9c14.3-8.9 25.1-24.1 24.8-45c-.3-20.3-11.7-33.4-24.6-41.6c-11.5-7.2-25.9-11.6-37.1-15l0 0-.7-.2c-12.8-3.9-21.9-6.7-28.3-10.5c-5.2-3.1-5.3-4.9-5.3-6.7c0-3.7 1.4-6.5 6.2-9.3c5.4-3.2 13.6-5.1 21.5-5c9.6 .1 20.2 2.2 31.2 5.2c10.7 2.8 21.6-3.5 24.5-14.2s-3.5-21.6-14.2-24.5c-6.5-1.7-13.7-3.4-21.1-4.7V216z"/></svg>`;
      } else if (npc.class === 40) {
        html = `<svg class="bank" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M243.4 2.6l-224 96c-14 6-21.8 21-18.7 35.8S16.8 160 32 160v8c0 13.3 10.7 24 24 24H456c13.3 0 24-10.7 24-24v-8c15.2 0 28.3-10.7 31.3-25.6s-4.8-29.9-18.7-35.8l-224-96c-8-3.4-17.2-3.4-25.2 0zM128 224H64V420.3c-.6 .3-1.2 .7-1.8 1.1l-48 32c-11.7 7.8-17 22.4-12.9 35.9S17.9 512 32 512H480c14.1 0 26.5-9.2 30.6-22.7s-1.1-28.1-12.9-35.9l-48-32c-.6-.4-1.2-.7-1.8-1.1V224H384V416H344V224H280V416H232V224H168V416H128V224zM256 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>`;
      } else if (npc.class >= 20 && npc.class <= 35) {
        html = `<svg class="gm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 0H400c8.8 0 16 7.2 16 16V80c0 8.8-7.2 16-16 16H320.7l89.6 64H512c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H336V400c0-26.5-21.5-48-48-48s-48 21.5-48 48V512H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64H165.7L256 95.5V32c0-17.7 14.3-32 32-32zm48 240a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM80 224c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H80zm368 16v64c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H464c-8.8 0-16 7.2-16 16zM80 352c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H80zm384 0c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H464z"/></svg>`;
      }
    }
    return html;
  }

  rgbToHex(r: string, g: string, b: string) {
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g)
      .toString(16)
      .padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }

  getClass(npc: Npc) {
    return allClasses[npc.class] || 'Unknown';
  }

  downloadMapfile(zone: string) {
    this.apiService.getMapfile(zone);
  }

  findMatchingZoneId(label: string) {
    const ignoredTokens = ['to', 'the', 'of', 'desert', 'plains'];

    // This happens first, before any changes happen to label/tokens
    const labelSanitize = (label: string) => {
      if (label === 'To Erudin') {
        label = 'To City of Erudin';
      } else if (label.startsWith('To Paineel')) {
        label = 'To City of Paineel';
      }
      return label
        .toLowerCase()
        .replace('ruins of old guk', 'lower guk')
        .replace('city of guk', 'upper guk')
        .replace('fourth gate', 'palace')
        .replace('liberated citadel', '')
        .replace('aquaduct system', 'catacombs')
        .replace('feerott', 'feerrott')
        .replace('forrest', 'forest')
        .replace('kerra ridge', 'kerra isle')
        .replace('toxullia', 'toxxulia')
        .replace('clan', '')
        .replace(/\(.*\)/, '');
    };
    // This happens AFTER we sanitize the whole label and we've tokenized it.  Also applied to full zone name.
    const tokenSanitize = (token: string) =>
      token
        .toLowerCase()
        .replace('northern', 'north')
        .replace('southern', 'south')
        .replace('eastern', 'east')
        .replace('western', 'west')
        .replace(/[^a-z]/g, ''); // only alpha characters

    const zoneAdjustments = (zoneName: string) =>
      zoneName.toLowerCase().replace('feerott', 'feerrott');

    const tokens = labelSanitize(label)
      .split(/\s+/)
      .map(tokenSanitize)
      .filter(
        (token) => token && !ignoredTokens.some((ignored) => ignored === token)
      );

    const matchingZone = allZones.find((zone) => {
      const zoneName = tokenSanitize(zoneAdjustments(zone.name));
      return tokens.every((token) => zoneName.includes(token));
    });
    return matchingZone?.id || null;
  }

  togglePanning(isEnabled: boolean) {
    if (!this.map) {
      return;
    }
    if (isEnabled && !this.map.dragging.enabled()) {
      this.map.dragging.enable();
    } else if (!isEnabled && this.map.dragging.enabled()) {
      this.map.dragging.disable();
    }
  }

  getIconSize(zoom?: number): L.PointExpression {
    const zoomLevel = zoom || this.map.getZoom();
    if (zoomLevel <= 8) {
      const value = (zoomLevel / 8) * 16;
      return [value, value];
    }

    return [16, 16];
  }

  getIconAnchor(zoom?: number): L.PointExpression {
    const iconSize = this.getIconSize(zoom);
    const anchorValue = (iconSize as [number, number])[0] / 2;
    return [anchorValue, anchorValue];
  }

  onZoomEnd(event: L.ZoomAnimEvent) {
    const newIconSize = this.getIconSize(event.zoom);
    const newIconAnchor = this.getIconAnchor(event.zoom);

    this.zLayers.forEach((zLayer) => {
      zLayer.spawnGroup.getLayers().forEach((spawnLayer) => {
        const marker = spawnLayer as L.Marker<L.DivIcon>;
        const icon = marker.getIcon();
        if (icon.options.className?.includes('static-size')) {
          return;
        }
        icon.options.iconSize = newIconSize;
        icon.options.iconAnchor = newIconAnchor;
        marker.setIcon(icon);
      });
    });
  }

  async getZoneFileName(shortName: string) {
    if (!zoneMap.get(this.zoneShortName)) {
      const zone = await this.apiService.getZone(this.zoneShortName);
      return zone.file_name;
    }
    return shortName;
  }

  async getZoneFullName(shortName: string) {
    if (!zoneMap.get(shortName)) {
      const zone = await this.apiService.getZone(shortName);
      return zone.long_name;
    }
    return zoneMap.get(shortName)?.name;
  }
}
