export type CraftItem = {
  id: number;
  name: string;
  category: string;
  job: 'DoH' | 'DoL' | 'Omni';
  level: number;
  stars: number;
  yields: number;
  isExpert: boolean;
  homeServer: string;
  region: string;
  dataCenter: string;
  marketPrice: number | null;
  recentSalePrice: number | null;
  materialCost: number | null;
  marketPurchaseCost: number | null;
  universalisUrl: string;
};

export type MarketSnapshotData = {
  items: CraftItem[];
  capturedAt: string;
};

export function baseMarketItems(): CraftItem[] {
  return [
    {
      id: 1,
      name: "Indagator's Alembic",
      category: 'Alchemist',
      job: 'DoH',
      level: 90,
      stars: 4,
      yields: 1,
      isExpert: false,
      homeServer: 'Ravana',
      region: 'Elemental',
      dataCenter: 'Elemental',
      marketPrice: 420000,
      recentSalePrice: 398000,
      materialCost: 215000,
      marketPurchaseCost: 230000,
      universalisUrl: 'https://universalis.app/market/indagators-alembic'
    },
    {
      id: 2,
      name: 'Resplendent Saw',
      category: 'Carpenter',
      job: 'Omni',
      level: 90,
      stars: 4,
      yields: 1,
      isExpert: true,
      homeServer: 'Leviathan',
      region: 'Primal',
      dataCenter: 'Primal',
      marketPrice: 915000,
      recentSalePrice: 880000,
      materialCost: 540000,
      marketPurchaseCost: 600000,
      universalisUrl: 'https://universalis.app/market/resplendent-saw'
    },
    {
      id: 3,
      name: 'Chondrite Ingot',
      category: 'Blacksmith',
      job: 'DoH',
      level: 90,
      stars: 2,
      yields: 3,
      isExpert: false,
      homeServer: 'Balmung',
      region: 'Crystal',
      dataCenter: 'Crystal',
      marketPrice: 18500,
      recentSalePrice: 17000,
      materialCost: 8900,
      marketPurchaseCost: 9800,
      universalisUrl: 'https://universalis.app/market/chondrite-ingot'
    },
    {
      id: 4,
      name: 'Rarefied Sykon Bavarois',
      category: 'Culinarian',
      job: 'DoH',
      level: 80,
      stars: 1,
      yields: 3,
      isExpert: false,
      homeServer: 'Cerberus',
      region: 'Chaos',
      dataCenter: 'Chaos',
      marketPrice: 3200,
      recentSalePrice: 4100,
      materialCost: 1500,
      marketPurchaseCost: 2000,
      universalisUrl: 'https://universalis.app/market/rarefied-sykon-bavarois'
    },
    {
      id: 5,
      name: 'Facet Miqote Halfrobe',
      category: 'Weaver',
      job: 'DoH',
      level: 78,
      stars: 0,
      yields: 1,
      isExpert: false,
      homeServer: 'Gilgamesh',
      region: 'Aether',
      dataCenter: 'Aether',
      marketPrice: 280000,
      recentSalePrice: null,
      materialCost: 162000,
      marketPurchaseCost: 170000,
      universalisUrl: 'https://universalis.app/market/facet-miqote-halfrobe'
    },
    {
      id: 6,
      name: 'Rarefied Titanoboa Skin',
      category: 'Leatherworker',
      job: 'DoH',
      level: 72,
      stars: 0,
      yields: 1,
      isExpert: false,
      homeServer: 'Lich',
      region: 'Light',
      dataCenter: 'Light',
      marketPrice: null,
      recentSalePrice: 26000,
      materialCost: 12000,
      marketPurchaseCost: null,
      universalisUrl: 'https://universalis.app/market/rarefied-titanoboa-skin'
    }
  ];
}

export function createSnapshotData(): MarketSnapshotData {
  return {
    items: baseMarketItems(),
    capturedAt: new Date().toISOString()
  };
}
