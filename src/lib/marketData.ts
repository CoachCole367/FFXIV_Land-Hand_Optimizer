import { recipes, RecipeDefinition, RecipeIngredient } from './recipes';
import { Region, regionForDataCenter, toUniversalisRegion } from './servers';

export type PriceStats = {
  average: number | null;
  median: number | null;
  minListing: number | null;
  recentSaleVelocity: number | null;
  lastUpload?: string;
};

export type IngredientMarket = RecipeIngredient & {
  overridePrice?: number;
  prices: {
    home: PriceStats;
    region: PriceStats;
  };
};

export type RecipeMarket = RecipeDefinition & {
  universalisUrl: string;
  ingredients: IngredientMarket[];
  outputPrices: {
    home: PriceStats;
    region: PriceStats;
  };
  complexity: number;
  timedNodeCount: number;
};

export type MarketSnapshotData = {
  items: RecipeMarket[];
  capturedAt: string;
  cacheMs: number;
  source: 'universalis' | 'fallback';
};

const DEFAULT_CACHE_MS = 12 * 60 * 1000; // 12 minutes within 5-15 minute target

let cachedSnapshot: { data: MarketSnapshotData; capturedAt: number } | null = null;

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function resolveLocationContext(options?: {
  homeWorld?: string;
  dataCenter?: string;
  region?: string;
}): { homeWorld: string; dataCenter?: string; regionLabel: string; regionScope: string } {
  const homeWorld = options?.homeWorld ?? 'Ravana';
  const dataCenter = options?.dataCenter;
  const regionFromProvided = options?.region
    ? (regionForDataCenter(options.region as Region | string) ?? (options.region as Region | string))
    : undefined;
  const regionLabelFromDc = dataCenter ? regionForDataCenter(dataCenter as Region | string) : undefined;
  const regionLabel = regionFromProvided ?? regionLabelFromDc ?? 'North America';
  const regionScope = toUniversalisRegion(regionLabel as Region | string);

  return { homeWorld, dataCenter, regionLabel, regionScope };
}

async function fetchUniversalisPrice(location: string, itemId: number): Promise<PriceStats> {
  const url = `https://universalis.app/api/v2/${encodeURIComponent(location)}/${itemId}?listings=10&entries=20`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Universalis status ${res.status}`);
    const data = await res.json();
    const history = Array.isArray(data.recentHistory) ? data.recentHistory : [];
    const histPrices = history.map((h: any) => Number(h.pricePerUnit)).filter((v: number) => Number.isFinite(v));
    const medianHistory = median(histPrices);
    const averageHistory = histPrices.length
      ? histPrices.reduce((sum: number, v: number) => sum + v, 0) / histPrices.length
      : null;
    const minListing = Array.isArray(data.listings) && data.listings.length
      ? Number(data.listings[0].pricePerUnit)
      : data.minPrice ?? null;
    return {
      average: data.averagePriceNQ ?? averageHistory,
      median: data.median ?? medianHistory ?? data.averagePriceNQ ?? null,
      minListing: Number.isFinite(minListing) ? Number(minListing) : null,
      recentSaleVelocity: data.regularSaleVelocity ?? data.nqSaleVelocity ?? null,
      lastUpload: data.lastUploadTime ? new Date(data.lastUploadTime).toISOString() : undefined
    };
  } catch (error) {
    console.error(`Failed to fetch Universalis for ${itemId} @ ${location}:`, error);
    return {
      average: null,
      median: null,
      minListing: null,
      recentSaleVelocity: null,
      lastUpload: undefined
    };
  }
}

async function fetchPriceForLocations(
  itemId: number,
  home: string,
  regionScope: string
): Promise<{ home: PriceStats; region: PriceStats }> {
  const [homePrices, regionPrices] = await Promise.all([
    fetchUniversalisPrice(home, itemId),
    fetchUniversalisPrice(regionScope, itemId)
  ]);

  return {
    home: homePrices,
    region: regionPrices
  };
}

async function priceRecipe(
  recipe: RecipeDefinition,
  locations: { homeWorld: string; dataCenter?: string; regionLabel: string; regionScope: string },
  overrides?: Record<number, number>
): Promise<RecipeMarket> {
  const pricedIngredients: IngredientMarket[] = [];

  for (const ing of recipe.ingredients) {
    const prices = await fetchPriceForLocations(ing.itemId, locations.homeWorld, locations.regionScope);
    pricedIngredients.push({
      ...ing,
      overridePrice: overrides?.[ing.itemId],
      prices
    });
  }

  const outputPrices = await fetchPriceForLocations(recipe.outputItemId, locations.homeWorld, locations.regionScope);

  return {
    ...recipe,
    homeWorld: locations.homeWorld,
    dataCenter: locations.dataCenter ?? recipe.dataCenter,
    region: locations.regionLabel,
    universalisUrl: `https://universalis.app/market/${recipe.universalisSlug ?? recipe.outputItemId}`,
    ingredients: pricedIngredients,
    outputPrices,
    complexity: recipe.ingredients.length,
    timedNodeCount: recipe.ingredients.filter((ing) => ing.timedNode).length
  };
}

export async function captureMarketSnapshot(options?: {
  homeWorld?: string;
  dataCenter?: string;
  region?: string;
  cacheMs?: number;
  forceRefresh?: boolean;
  overrides?: Record<number, number>;
}): Promise<MarketSnapshotData> {
  const { homeWorld, dataCenter, regionLabel, regionScope } = resolveLocationContext(options);
  const cacheMs = options?.cacheMs ?? DEFAULT_CACHE_MS;

  if (!options?.forceRefresh && cachedSnapshot && Date.now() - cachedSnapshot.capturedAt < cacheMs) {
    return cachedSnapshot.data;
  }

  const priced = await Promise.all(
    recipes.map((r) => priceRecipe(r, { homeWorld, dataCenter, regionLabel, regionScope }, options?.overrides))
  );
  console.log('[marketData] Priced recipes', {
    recipeCount: recipes.length,
    pricedCount: priced.length,
    homeWorld,
    region: regionLabel,
    regionScope
  });
  const snapshot: MarketSnapshotData = {
    items: priced,
    capturedAt: new Date().toISOString(),
    cacheMs,
    source: priced.some((item) => item.outputPrices.home.average === null && item.outputPrices.region.average === null)
      ? 'fallback'
      : 'universalis'
  };

  cachedSnapshot = { data: snapshot, capturedAt: Date.now() };
  return snapshot;
}
