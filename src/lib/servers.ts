export type Region =
  | 'North America'
  | 'Europe'
  | 'Japan'
  | 'Oceania'
  | 'Korea'
  | 'China';

export type DataCenter = {
  name: string;
  region: Region;
  worlds: string[];
};

export const dataCenters: DataCenter[] = [
  {
    name: 'Aether',
    region: 'North America',
    worlds: [
      'Adamantoise',
      'Cactuar',
      'Faerie',
      'Gilgamesh',
      'Jenova',
      'Midgardsormr',
      'Sargatanas',
      'Siren'
    ]
  },
  {
    name: 'Primal',
    region: 'North America',
    worlds: [
      'Behemoth',
      'Excalibur',
      'Exodus',
      'Famfrit',
      'Hyperion',
      'Lamia',
      'Leviathan',
      'Ultros'
    ]
  },
  {
    name: 'Crystal',
    region: 'North America',
    worlds: [
      'Balmung',
      'Brynhildr',
      'Coeurl',
      'Diabolos',
      'Goblin',
      'Malboro',
      'Mateus',
      'Zalera'
    ]
  },
  {
    name: 'Dynamis',
    region: 'North America',
    worlds: ['Halicarnassus', 'Maduin', 'Marilith', 'Seraph']
  },
  {
    name: 'Chaos',
    region: 'Europe',
    worlds: ['Cerberus', 'Louisoix', 'Moogle', 'Omega', 'Phantom', 'Ragnarok', 'Sagittarius', 'Spriggan']
  },
  {
    name: 'Light',
    region: 'Europe',
    worlds: ['Alpha', 'Lich', 'Odin', 'Phoenix', 'Raiden', 'Shiva', 'Twintania', 'Zodiark']
  },
  {
    name: 'Shadow',
    region: 'Europe',
    worlds: ['Innocence', 'Pixie', 'Titania', 'Tycoon']
  },
  {
    name: 'Elemental',
    region: 'Japan',
    worlds: ['Aegis', 'Atomos', 'Carbuncle', 'Garuda', 'Gungnir', 'Kujata', 'Tonberry', 'Typhon']
  },
  {
    name: 'Gaia',
    region: 'Japan',
    worlds: ['Alexander', 'Bahamut', 'Durandal', 'Fenrir', 'Ifrit', 'Ridill', 'Tiamat', 'Ultima']
  },
  {
    name: 'Mana',
    region: 'Japan',
    worlds: ['Anima', 'Asura', 'Chocobo', 'Hades', 'Ixion', 'Masamune', 'Pandaemonium', 'Titan']
  },
  {
    name: 'Meteor',
    region: 'Japan',
    worlds: ['Belias', 'Mandragora', 'Ramuh', 'Shinryu', 'Unicorn', 'Valefor', 'Yojimbo', 'Zeromus']
  },
  {
    name: 'Materia',
    region: 'Oceania',
    worlds: ['Bismarck', 'Ravana', 'Sephirot', 'Sophia', 'Zurvan']
  },
  {
    name: 'Korea',
    region: 'Korea',
    worlds: ['Louisoix (KR)', 'Moogle (KR)', 'Omega (KR)', 'Ragnarok (KR)']
  },
  {
    name: 'China',
    region: 'China',
    worlds: ['LuXingNiao', 'ShenYiZhiDi', 'HuanYingQunDao', 'MengYaChi', 'YuZhouHeYin']
  }
];

export const regions: Region[] = Array.from(new Set(dataCenters.map((dc) => dc.region)));

export function dataCentersForRegion(region?: string) {
  if (!region) return dataCenters;
  return dataCenters.filter((dc) => dc.region === region);
}

export function worldsForDataCenter(dcName?: string) {
  if (!dcName) return dataCenters.flatMap((dc) => dc.worlds);
  const match = dataCenters.find((dc) => dc.name === dcName);
  return match ? match.worlds : [];
}

export function regionForDataCenter(dcName?: string) {
  const match = dataCenters.find((dc) => dc.name === dcName);
  return match?.region;
}

export function toUniversalisRegion(region: Region | string) {
  const map: Record<string, string> = {
    'North America': 'North-America',
    Europe: 'Europe',
    Japan: 'Japan',
    Oceania: 'Oceania',
    Korea: 'Korea',
    China: 'China'
  };

  return map[region] ?? String(region);
}
