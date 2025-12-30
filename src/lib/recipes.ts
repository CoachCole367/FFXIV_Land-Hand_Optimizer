export type RecipeIngredient = {
  itemId: number;
  name: string;
  quantity: number;
  vendorPrice?: number;
  timedNode?: boolean;
};

export type RecipeDefinition = {
  id: number;
  outputItemId: number;
  name: string;
  category: string;
  job: 'DoH' | 'DoL' | 'Omni';
  level: number;
  stars: number;
  yields: number;
  isExpert: boolean;
  universalisSlug?: string;
  homeWorld?: string;
  dataCenter?: string;
  region?: string;
  ingredients: RecipeIngredient[];
};

export const recipes: RecipeDefinition[] = [
  {
    id: 37038,
    outputItemId: 37038,
    name: "Indagator's Alembic",
    category: 'Alchemist',
    job: 'DoH',
    level: 90,
    stars: 4,
    yields: 1,
    isExpert: false,
    universalisSlug: 'indagators-alembic',
    homeWorld: 'Ravana',
    dataCenter: 'Elemental',
    region: 'Elemental',
    ingredients: [
      { itemId: 37019, name: 'Grade 8 Tinctures Base', quantity: 2 },
      { itemId: 37277, name: 'Dravanian Spring Water', quantity: 1, timedNode: true },
      { itemId: 37276, name: 'Paldao Lumber', quantity: 2 },
      { itemId: 37274, name: 'Hannish Fiber', quantity: 1 }
    ]
  },
  {
    id: 37057,
    outputItemId: 37057,
    name: 'Resplendent Saw',
    category: 'Carpenter',
    job: 'Omni',
    level: 90,
    stars: 4,
    yields: 1,
    isExpert: true,
    universalisSlug: 'resplendent-saw',
    homeWorld: 'Leviathan',
    dataCenter: 'Primal',
    region: 'Primal',
    ingredients: [
      { itemId: 37055, name: 'Resplendent Carpenter Component', quantity: 6, timedNode: true },
      { itemId: 37276, name: 'Paldao Lumber', quantity: 3 },
      { itemId: 36070, name: 'Ophiotauros Leather', quantity: 2 },
      { itemId: 36076, name: 'Integral Log', quantity: 4 }
    ]
  },
  {
    id: 36218,
    outputItemId: 36218,
    name: 'Chondrite Ingot',
    category: 'Blacksmith',
    job: 'DoH',
    level: 90,
    stars: 2,
    yields: 3,
    isExpert: false,
    universalisSlug: 'chondrite-ingot',
    homeWorld: 'Balmung',
    dataCenter: 'Crystal',
    region: 'Crystal',
    ingredients: [
      { itemId: 36078, name: 'Chondrite', quantity: 3 },
      { itemId: 36137, name: 'Manganese Ore', quantity: 1, timedNode: true },
      { itemId: 36123, name: 'Cinderfoot Olive Oil', quantity: 1, vendorPrice: 1200 }
    ]
  },
  {
    id: 36114,
    outputItemId: 36114,
    name: 'Rarefied Sykon Bavarois',
    category: 'Culinarian',
    job: 'DoH',
    level: 80,
    stars: 1,
    yields: 3,
    isExpert: false,
    universalisSlug: 'rarefied-sykon-bavarois',
    homeWorld: 'Cerberus',
    dataCenter: 'Chaos',
    region: 'Chaos',
    ingredients: [
      { itemId: 36109, name: 'Sykon', quantity: 6, timedNode: true },
      { itemId: 36110, name: 'Palm Syrup', quantity: 2 },
      { itemId: 36111, name: 'Sweet Cream', quantity: 1, vendorPrice: 400 },
      { itemId: 36112, name: 'Gelatin', quantity: 1, vendorPrice: 300 }
    ]
  },
  {
    id: 34101,
    outputItemId: 34101,
    name: 'Facet Miqote Halfrobe',
    category: 'Weaver',
    job: 'DoH',
    level: 78,
    stars: 0,
    yields: 1,
    isExpert: false,
    universalisSlug: 'facet-miqote-halfrobe',
    homeWorld: 'Gilgamesh',
    dataCenter: 'Aether',
    region: 'Aether',
    ingredients: [
      { itemId: 33913, name: 'Dwarven Cotton', quantity: 4, timedNode: true },
      { itemId: 33910, name: 'Dwarven Cotton Boll', quantity: 8 },
      { itemId: 33911, name: 'Dwarven Cotton Yarn', quantity: 4 },
      { itemId: 33912, name: 'Dwarven Cotton Cloth', quantity: 4 }
    ]
  },
  {
    id: 31577,
    outputItemId: 31577,
    name: 'Rarefied Titanoboa Skin',
    category: 'Leatherworker',
    job: 'DoH',
    level: 72,
    stars: 0,
    yields: 1,
    isExpert: false,
    universalisSlug: 'rarefied-titanoboa-skin',
    homeWorld: 'Lich',
    dataCenter: 'Light',
    region: 'Light',
    ingredients: [
      { itemId: 31575, name: 'Titanoboa Leather', quantity: 3 },
      { itemId: 31573, name: 'Titanoboa Scale', quantity: 8, timedNode: true },
      { itemId: 31574, name: 'Gum Arabic', quantity: 2, vendorPrice: 250 }
    ]
  }
];
