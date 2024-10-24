import { Npc } from '../npcs/npc.entity';

interface ZoneItem {
  id: string;
  name: string;
  era: string;
}

export const allZones = [
  {
    id: 'qeynos',
    name: 'South Qeynos',
    era: 'Old World',
  },
  {
    id: 'qeynos2',
    name: 'North Qeynos',
    era: 'Old World',
  },
  {
    id: 'qrg',
    name: 'Surefall Glade',
    era: 'Old World',
  },
  {
    id: 'qeytoqrg',
    name: 'Qeynos Hills',
    era: 'Old World',
  },
  {
    id: 'highpass',
    name: 'Highpass Hold',
    era: 'Old World',
  },
  {
    id: 'highkeep',
    name: 'Highpass Keep',
    era: 'Old World',
  },
  {
    id: 'freportn',
    name: 'North Freeport',
    era: 'Old World',
  },
  {
    id: 'freportw',
    name: 'West Freeport',
    era: 'Old World',
  },
  {
    id: 'freporte',
    name: 'East Freeport',
    era: 'Old World',
  },
  {
    id: 'runnyeye',
    name: 'Clan RunnyEye',
    era: 'Old World',
  },
  {
    id: 'qey2hh1',
    name: 'West Karana',
    era: 'Old World',
  },
  {
    id: 'northkarana',
    name: 'North Karana',
    era: 'Old World',
  },
  {
    id: 'southkarana',
    name: 'South Karana',
    era: 'Old World',
  },
  {
    id: 'eastkarana',
    name: 'East Karana',
    era: 'Old World',
  },
  {
    id: 'beholder',
    name: 'Gorge of King Xorbb',
    era: 'Old World',
  },
  {
    id: 'blackburrow',
    name: 'BlackBurrow',
    era: 'Old World',
  },
  {
    id: 'paw',
    name: 'Lair of the Splitpaw',
    era: 'Old World',
  },
  {
    id: 'rivervale',
    name: 'Rivervale',
    era: 'Old World',
  },
  {
    id: 'kithicor',
    name: 'Kithicor Forest',
    era: 'Old World',
  },
  {
    id: 'commons',
    name: 'West Commonlands',
    era: 'Old World',
  },
  {
    id: 'ecommons',
    name: 'East Commonlands',
    era: 'Old World',
  },
  {
    id: 'erudnint',
    name: 'Erudin Palace',
    era: 'Old World',
  },
  {
    id: 'erudnext',
    name: 'Erudin',
    era: 'Old World',
  },
  {
    id: 'nektulos',
    name: 'Nektulos Forest',
    era: 'Old World',
  },
  {
    id: 'cshome',
    name: 'Sunset Home',
    era: 'Old World',
  },
  {
    id: 'lavastorm',
    name: 'Lavastorm Mountains',
    era: 'Old World',
  },
  {
    id: 'nektropos',
    name: 'Nektropos',
    era: 'Old World',
  },
  {
    id: 'halas',
    name: 'Halas',
    era: 'Old World',
  },
  {
    id: 'everfrost',
    name: 'Everfrost Peaks',
    era: 'Old World',
  },
  {
    id: 'soldunga',
    name: "Solusek's Eye",
    era: 'Old World',
  },
  {
    id: 'soldungb',
    name: "Nagafen's Lair",
    era: 'Old World',
  },
  {
    id: 'misty',
    name: 'Misty Thicket',
    era: 'Old World',
  },
  {
    id: 'nro',
    name: 'North Ro',
    era: 'Old World',
  },
  {
    id: 'sro',
    name: 'South Ro',
    era: 'Old World',
  },
  {
    id: 'befallen',
    name: 'Befallen',
    era: 'Old World',
  },
  {
    id: 'oasis',
    name: 'Oasis of Marr',
    era: 'Old World',
  },
  {
    id: 'tox',
    name: 'Toxxulia Forest',
    era: 'Old World',
  },
  {
    id: 'hole',
    name: 'The Ruins of Old Paineel',
    era: 'Old World',
  },
  {
    id: 'neriaka',
    name: 'Neriak Foreign Quarter',
    era: 'Old World',
  },
  {
    id: 'neriakb',
    name: 'Neriak Commons',
    era: 'Old World',
  },
  {
    id: 'neriakc',
    name: 'Neriak Third Gate',
    era: 'Old World',
  },
  {
    id: 'neriakd',
    name: 'Neriak Palace',
    era: 'Old World',
  },
  {
    id: 'najena',
    name: 'Najena',
    era: 'Old World',
  },
  {
    id: 'qcat',
    name: 'Qeynos Catacombs',
    era: 'Old World',
  },
  {
    id: 'innothule',
    name: 'Innothule Swamp',
    era: 'Old World',
  },
  {
    id: 'feerrott',
    name: 'The Feerrott',
    era: 'Old World',
  },
  {
    id: 'cazicthule',
    name: 'Cazic-Thule',
    era: 'Old World',
  },
  {
    id: 'oggok',
    name: 'Oggok',
    era: 'Old World',
  },
  {
    id: 'rathemtn',
    name: 'Mountains of Rathe',
    era: 'Old World',
  },
  {
    id: 'lakerathe',
    name: 'Lake Rathetear',
    era: 'Old World',
  },
  {
    id: 'grobb',
    name: 'Grobb',
    era: 'Old World',
  },
  {
    id: 'aviak',
    name: 'Aviak Village',
    era: 'Old World',
  },
  {
    id: 'gfaydark',
    name: 'Greater Faydark',
    era: 'Old World',
  },
  {
    id: 'akanon',
    name: "Ak'Anon",
    era: 'Old World',
  },
  {
    id: 'steamfont',
    name: 'Steamfont Mountains',
    era: 'Old World',
  },
  {
    id: 'lfaydark',
    name: 'Lesser Faydark',
    era: 'Old World',
  },
  {
    id: 'crushbone',
    name: 'Clan Crushbone',
    era: 'Old World',
  },
  {
    id: 'mistmoore',
    name: 'Castle Mistmoore',
    era: 'Old World',
  },
  {
    id: 'kaladima',
    name: 'South Kaladim',
    era: 'Old World',
  },
  {
    id: 'felwithea',
    name: 'North Felwithe',
    era: 'Old World',
  },
  {
    id: 'felwitheb',
    name: 'South Felwithe',
    era: 'Old World',
  },
  {
    id: 'unrest',
    name: 'Estate of Unrest',
    era: 'Old World',
  },
  {
    id: 'kedge',
    name: 'Kedge Keep',
    era: 'Old World',
  },
  {
    id: 'guktop',
    name: 'Upper Guk',
    era: 'Old World',
  },
  {
    id: 'gukbottom',
    name: 'Lower Guk',
    era: 'Old World',
  },
  {
    id: 'kaladimb',
    name: 'North Kaladim',
    era: 'Old World',
  },
  {
    id: 'butcher',
    name: 'Butcherblock Mountains',
    era: 'Old World',
  },
  {
    id: 'oot',
    name: 'Ocean of Tears',
    era: 'Old World',
  },
  {
    id: 'cauldron',
    name: "Dagnor's Cauldron",
    era: 'Old World',
  },
  {
    id: 'airplane',
    name: 'Plane of Sky',
    era: 'Old World',
  },
  {
    id: 'fearplane',
    name: 'Plane of Fear',
    era: 'Old World',
  },
  {
    id: 'permafrost',
    name: 'Permafrost Keep',
    era: 'Old World',
  },
  {
    id: 'kerraridge',
    name: 'Kerra Isle',
    era: 'Old World',
  },
  {
    id: 'paineel',
    name: 'Paineel',
    era: 'Old World',
  },
  {
    id: 'hateplane',
    name: 'The Plane of Hate',
    era: 'Old World',
  },
  {
    id: 'arena',
    name: 'The Arena',
    era: 'Old World',
  },
  {
    id: 'fieldofbone',
    name: 'The Field of Bone',
    era: 'Kunark',
  },
  {
    id: 'warslikswood',
    name: 'Warsliks Wood',
    era: 'Kunark',
  },
  {
    id: 'soltemple',
    name: 'Temple of Solusek Ro',
    era: 'Old World',
  },
  {
    id: 'droga',
    name: 'Temple of Droga',
    era: 'Kunark',
  },
  {
    id: 'cabwest',
    name: 'West Cabilis',
    era: 'Kunark',
  },
  {
    id: 'swampofnohope',
    name: 'Swamp of No Hope',
    era: 'Kunark',
  },
  {
    id: 'firiona',
    name: 'Firiona Vie',
    era: 'Kunark',
  },
  {
    id: 'lakeofillomen',
    name: 'Lake of Ill Omen',
    era: 'Kunark',
  },
  {
    id: 'dreadlands',
    name: 'Dreadlands',
    era: 'Kunark',
  },
  {
    id: 'burningwood',
    name: 'Burning Woods',
    era: 'Kunark',
  },
  {
    id: 'kaesora',
    name: 'Kaesora',
    era: 'Kunark',
  },
  {
    id: 'sebilis',
    name: 'Old Sebilis',
    era: 'Kunark',
  },
  {
    id: 'citymist',
    name: 'City of Mist',
    era: 'Kunark',
  },
  {
    id: 'skyfire',
    name: 'Skyfire Mountains',
    era: 'Kunark',
  },
  {
    id: 'frontiermtns',
    name: 'Frontier Mountains',
    era: 'Kunark',
  },
  {
    id: 'overthere',
    name: 'The Overthere',
    era: 'Kunark',
  },
  {
    id: 'emeraldjungle',
    name: 'The Emerald Jungle',
    era: 'Kunark',
  },
  {
    id: 'trakanon',
    name: "Trakanon's Teeth",
    era: 'Kunark',
  },
  {
    id: 'timorous',
    name: 'Timorous Deep',
    era: 'Kunark',
  },
  {
    id: 'kurn',
    name: "Kurn's Tower",
    era: 'Kunark',
  },
  {
    id: 'erudsxing',
    name: "Erud's Crossing",
    era: 'Old World',
  },
  {
    id: 'stonebrunt',
    name: 'Stonebrunt Mountains',
    era: 'Old World',
  },
  {
    id: 'warrens',
    name: 'The Warrens',
    era: 'Old World',
  },
  {
    id: 'karnor',
    name: "Karnor's Castle",
    era: 'Kunark',
  },
  {
    id: 'chardok',
    name: 'Chardok',
    era: 'Kunark',
  },
  {
    id: 'dalnir',
    name: 'Dalnir',
    era: 'Kunark',
  },
  {
    id: 'charasis',
    name: 'Howling Stones',
    era: 'Kunark',
  },
  {
    id: 'cabeast',
    name: 'East Cabilis',
    era: 'Kunark',
  },
  {
    id: 'nurga',
    name: 'Mines of Nurga',
    era: 'Kunark',
  },
  {
    id: 'veeshan',
    name: "Veeshan's Peak",
    era: 'Kunark',
  },
  {
    id: 'veksar',
    name: 'Veksar',
    era: 'Kunark',
  },
  {
    id: 'iceclad',
    name: 'Iceclad Ocean',
    era: 'Velious',
  },
  {
    id: 'frozenshadow',
    name: 'Tower of Frozen Shadow',
    era: 'Velious',
  },
  {
    id: 'velketor',
    name: "Velketor's Labyrinth",
    era: 'Velious',
  },
  {
    id: 'kael',
    name: 'Kael Drakkel',
    era: 'Velious',
  },
  {
    id: 'skyshrine',
    name: 'Skyshrine',
    era: 'Velious',
  },
  {
    id: 'thurgadina',
    name: 'Thurgadin',
    era: 'Velious',
  },
  {
    id: 'eastwastes',
    name: 'Eastern Wastes',
    era: 'Velious',
  },
  {
    id: 'cobaltscar',
    name: 'Cobalt Scar',
    era: 'Velious',
  },
  {
    id: 'greatdivide',
    name: 'Great Divide',
    era: 'Velious',
  },
  {
    id: 'wakening',
    name: 'The Wakening Land',
    era: 'Velious',
  },
  {
    id: 'westwastes',
    name: 'Western Wastes',
    era: 'Velious',
  },
  {
    id: 'crystal',
    name: 'Crystal Caverns',
    era: 'Velious',
  },
  {
    id: 'necropolis',
    name: 'Dragon Necropolis',
    era: 'Velious',
  },
  {
    id: 'templeveeshan',
    name: 'Temple of Veeshan',
    era: 'Velious',
  },
  {
    id: 'sirens',
    name: "Siren's Grotto",
    era: 'Velious',
  },
  {
    id: 'mischiefplane',
    name: 'Plane of Mischief',
    era: 'Velious',
  },
  {
    id: 'growthplane',
    name: 'Plane of Growth',
    era: 'Velious',
  },
  {
    id: 'sleeper',
    name: "Sleeper's Tomb",
    era: 'Velious',
  },
  {
    id: 'thurgadinb',
    name: 'Icewell Keep',
    era: 'Velious',
  },
  {
    id: 'shadowhaven',
    name: 'Shadow Haven',
    era: 'Luclin',
  },
  {
    id: 'bazaar',
    name: 'The Bazaar',
    era: 'Luclin',
  },
  {
    id: 'nexus',
    name: 'The Nexus',
    era: 'Luclin',
  },
  {
    id: 'echo',
    name: 'Echo Caverns',
    era: 'Luclin',
  },
  {
    id: 'acrylia',
    name: 'Acrylia Caverns',
    era: 'Luclin',
  },
  {
    id: 'sharvahl',
    name: 'Shar Vahl',
    era: 'Luclin',
  },
  {
    id: 'paludal',
    name: 'Paludal Caverns',
    era: 'Luclin',
  },
  {
    id: 'fungusgrove',
    name: 'Fungus Grove',
    era: 'Luclin',
  },
  {
    id: 'vexthal',
    name: 'Vex Thal',
    era: 'Luclin',
  },
  {
    id: 'sseru',
    name: 'Sanctus Seru',
    era: 'Luclin',
  },
  {
    id: 'katta',
    name: 'Katta Castellum',
    era: 'Luclin',
  },
  {
    id: 'netherbian',
    name: 'Netherbian Lair',
    era: 'Luclin',
  },
  {
    id: 'ssratemple',
    name: 'Ssraeshza Temple',
    era: 'Luclin',
  },
  {
    id: 'griegsend',
    name: "Grieg's End",
    era: 'Luclin',
  },
  {
    id: 'thedeep',
    name: 'The Deep',
    era: 'Luclin',
  },
  {
    id: 'shadeweaver',
    name: "Shadeweaver's Thicket",
    era: 'Luclin',
  },
  {
    id: 'hollowshade',
    name: 'Hollowshade Moor',
    era: 'Luclin',
  },
  {
    id: 'grimling',
    name: 'Grimling Forest',
    era: 'Luclin',
  },
  {
    id: 'mseru',
    name: 'Marus Seru',
    era: 'Luclin',
  },
  {
    id: 'letalis',
    name: 'Mons Letalis',
    era: 'Luclin',
  },
  {
    id: 'twilight',
    name: 'The Twilight Sea',
    era: 'Luclin',
  },
  {
    id: 'thegrey',
    name: 'The Grey',
    era: 'Luclin',
  },
  {
    id: 'tenebrous',
    name: 'The Tenebrous Mountains',
    era: 'Luclin',
  },
  {
    id: 'maiden',
    name: "The Maiden's Eye",
    era: 'Luclin',
  },
  {
    id: 'dawnshroud',
    name: 'Dawnshroud Peaks',
    era: 'Luclin',
  },
  {
    id: 'scarlet',
    name: 'The Scarlet Desert',
    era: 'Luclin',
  },
  {
    id: 'umbral',
    name: 'The Umbral Plains',
    era: 'Luclin',
  },
  {
    id: 'akheva',
    name: 'Akheva Ruins',
    era: 'Luclin',
  },
  {
    id: 'jaggedpine',
    name: 'The Jaggedpine Forest',
    era: 'Luclin',
  },
  {
    id: 'codecay',
    name: 'Ruins of Lxanvom',
    era: 'Planes of Power',
  },
  {
    id: 'pojustice',
    name: 'Plane of Justice',
    era: 'Planes of Power',
  },
  {
    id: 'poknowledge',
    name: 'Plane of Knowledge',
    era: 'Planes of Power',
  },
  {
    id: 'potranquility',
    name: 'Plane of Tranquility',
    era: 'Planes of Power',
  },
  {
    id: 'ponightmare',
    name: 'Plane of Nightmare',
    era: 'Planes of Power',
  },
  {
    id: 'podisease',
    name: 'Plane of Disease',
    era: 'Planes of Power',
  },
  {
    id: 'poinnovation',
    name: 'Plane of Innovation',
    era: 'Planes of Power',
  },
  {
    id: 'potorment',
    name: 'Plane of Torment',
    era: 'Planes of Power',
  },
  {
    id: 'povalor',
    name: 'Plane of Valor',
    era: 'Planes of Power',
  },
  {
    id: 'bothunder',
    name: 'Torden, The Bastion of Thunder',
    era: 'Planes of Power',
  },
  {
    id: 'postorms',
    name: 'Plane of Storms',
    era: 'Planes of Power',
  },
  {
    id: 'hohonora',
    name: 'Halls of Honor',
    era: 'Planes of Power',
  },
  {
    id: 'solrotower',
    name: "Solusek Ro's Tower",
    era: 'Planes of Power',
  },
  {
    id: 'powar',
    name: 'Plane of War',
    era: 'Planes of Power',
  },
  {
    id: 'potactics',
    name: 'Drunder, Fortress of Zek',
    era: 'Planes of Power',
  },
  {
    id: 'poair',
    name: 'Eryslai, the Kingdom of Wind',
    era: 'Planes of Power',
  },
  {
    id: 'powater',
    name: 'Reef of Coirnav',
    era: 'Planes of Power',
  },
  {
    id: 'pofire',
    name: 'Doomfire, The Burning Lands',
    era: 'Planes of Power',
  },
  {
    id: 'poeartha',
    name: 'Vegarlson, The Earthen Badlands',
    era: 'Planes of Power',
  },
  {
    id: 'potimea',
    name: 'Plane of Time',
    era: 'Planes of Power',
  },
  {
    id: 'hohonorb',
    name: 'Temple of Marr',
    era: 'Planes of Power',
  },
  {
    id: 'nightmareb',
    name: 'Lair of Terris Thule',
    era: 'Planes of Power',
  },
  {
    id: 'poearthb',
    name: 'Stronghold of the Twelve',
    era: 'Planes of Power',
  },
  {
    id: 'potimeb',
    name: 'Plane of Time (B)',
    era: 'Planes of Power',
  },
];

export const zoneMap = new Map<string, ZoneItem>(
  allZones.map((zone) => [zone.id, zone]),
);

export function isAllowedZone(zoneId: string) {
  return /^[a-zA-Z0-9\_]+$/.test(zoneId);
}
