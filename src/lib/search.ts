import { MarketSnapshot, Preset } from '@prisma/client';
import { MarketSnapshotData, RecipeMarket } from './marketData';
import { dataCentersForRegion, regionForDataCenter } from './servers';

export type CostMode = 'regionalMedian' | 'regionalAverage' | 'minListing' | 'blended';
export type RevenueMode = 'homeMin' | 'regionalMin' | 'regionalMedian' | 'regionalAverage';
export type SortKey = 'name' | 'profit' | 'roi' | 'level' | 'stars' | 'yields' | 'profitPerUnit' | 'timeToSell';

export type SearchParameters = {
  query: string;
  homeServer: string;
  region?: string;
  dataCenter: string;
  categories: string[];
  jobFilter: 'any' | 'DoH' | 'Omni';
  minSales: number;
  minPrice: number;
  minProfit: number;
  minYield: number;
  starLimit: number;
  levelRange: [number, number];
  expertOnly: boolean;
  onlyOmnicrafterFriendly: boolean;
  costMode: CostMode;
  revenueMode: RevenueMode;
  blendedListingWeight: number;
  includeVendorPrices: boolean;
  priceOverrides: Record<number, number>;
  timedNodeOnly: boolean;
  maxComplexity: number;
  maxTimeToSell: number;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
};

export type Financials = {
  revenue: number;
  revenuePerUnit: number;
  cost: number;
  profit: number;
  profitPerUnit: number;
  roi: number;
  timeToSellDays: number | null;
  saleVelocityPerDay: number | null;
  missing: string[];
};

export type SearchResult = {
  item: RecipeMarket;
  financials: Financials;
};

export type HydratedPreset = Preset & { snapshot: MarketSnapshot };

function pickPrice(stats: RecipeMarket['outputPrices']['region'], mode: CostMode | RevenueMode, blendWeight: number) {
  switch (mode) {
    case 'regionalMedian':
      return stats.median ?? stats.average ?? stats.minListing ?? null;
    case 'regionalAverage':
      return stats.average ?? stats.median ?? stats.minListing ?? null;
    case 'minListing':
    case 'homeMin':
    case 'regionalMin':
      return stats.minListing ?? stats.median ?? stats.average ?? null;
    case 'blended':
      if (stats.median != null && stats.minListing != null) {
        return stats.median * (1 - blendWeight) + stats.minListing * blendWeight;
      }
      return stats.median ?? stats.minListing ?? stats.average ?? null;
    default:
      return stats.average ?? stats.median ?? stats.minListing ?? null;
  }
}

export function computeFinancials(item: RecipeMarket, parameters: SearchParameters): Financials {
  const missing: string[] = [];
  const blendWeight = Math.min(Math.max(parameters.blendedListingWeight ?? 0.4, 0), 1);

  let materialCost = 0;
  for (const ing of item.ingredients) {
    const override = parameters.priceOverrides[ing.itemId] ?? ing.overridePrice;
    const vendorOk = parameters.includeVendorPrices && ing.vendorPrice != null;
    const regionalPrice = pickPrice(ing.prices.region, parameters.costMode, blendWeight);
    const price = override ?? (vendorOk ? ing.vendorPrice : undefined) ?? regionalPrice;
    if (price == null) {
      missing.push(`missing price for ${ing.name}`);
      continue;
    }
    materialCost += price * ing.quantity;
  }

  const revenueBase = pickPrice(
    parameters.revenueMode === 'homeMin' ? item.outputPrices.home : item.outputPrices.region,
    parameters.revenueMode,
    blendWeight
  );
  if (revenueBase == null) missing.push('revenue');

  const revenue = (revenueBase ?? 0) * item.yields;
  const revenuePerUnit = revenueBase ?? 0;
  const profit = revenue - materialCost;
  const profitPerUnit = item.yields > 0 ? profit / item.yields : profit;
  const roi = materialCost > 0 ? profit / materialCost : 0;
  const saleVelocity = item.outputPrices.home.recentSaleVelocity ?? item.outputPrices.region.recentSaleVelocity;
  const timeToSellDays = saleVelocity && saleVelocity > 0 ? item.yields / saleVelocity : null;

  return {
    revenue,
    revenuePerUnit,
    cost: materialCost,
    profit,
    profitPerUnit,
    roi,
    timeToSellDays,
    saleVelocityPerDay: saleVelocity ?? null,
    missing
  };
}

export function runSearch(
  snapshotData: MarketSnapshotData,
  parameters: SearchParameters
): { results: SearchResult[]; availableCategories: string[] } {
  const items = snapshotData.items;
  const debugCounts: Record<string, number> = { loaded: items.length };
  const lowerQuery = parameters.query.trim().toLowerCase();
  const availableCategories = Array.from(new Set(items.map((item) => item.category))).sort();

  const derivedRegion = parameters.region ?? regionForDataCenter(parameters.dataCenter) ?? '';
  const regionDataCenters = dataCentersForRegion(derivedRegion).map((dc) => dc.name.toLowerCase());

  const withFinancials = items.map((item) => ({
    item,
    financials: computeFinancials(item, parameters)
  }));
  debugCounts.withFinancials = withFinancials.length;

  const filtered = withFinancials
    .filter(({ item }) => {
      const match = !lowerQuery ? true : item.name.toLowerCase().includes(lowerQuery);
      if (match) debugCounts.query = (debugCounts.query ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = !parameters.homeServer
        ? true
        : (item.homeWorld ?? '').toLowerCase().includes(parameters.homeServer.toLowerCase());
      if (match) debugCounts.homeServer = (debugCounts.homeServer ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      if (!derivedRegion) {
        debugCounts.region = (debugCounts.region ?? 0) + 1;
        return true;
      }
      const candidate = (item.region ?? '').toLowerCase();
      const match = candidate.includes(derivedRegion.toLowerCase()) || regionDataCenters.some((dc) => candidate.includes(dc));
      if (match) debugCounts.region = (debugCounts.region ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = !parameters.dataCenter
        ? true
        : (item.dataCenter ?? '').toLowerCase().includes(parameters.dataCenter.toLowerCase());
      if (match) debugCounts.dataCenter = (debugCounts.dataCenter ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = parameters.categories.length === 0 ? true : parameters.categories.includes(item.category);
      if (match) debugCounts.categories = (debugCounts.categories ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match =
        parameters.jobFilter === 'any'
          ? true
          : item.job === parameters.jobFilter || (parameters.jobFilter === 'Omni' && item.job === 'Omni');
      if (match) debugCounts.job = (debugCounts.job ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = parameters.expertOnly ? item.isExpert : true;
      if (match) debugCounts.expert = (debugCounts.expert ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = parameters.timedNodeOnly ? item.timedNodeCount > 0 : true;
      if (match) debugCounts.timedNodes = (debugCounts.timedNodes ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = item.complexity <= parameters.maxComplexity;
      if (match) debugCounts.complexity = (debugCounts.complexity ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = item.yields >= parameters.minYield;
      if (match) debugCounts.yields = (debugCounts.yields ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = item.stars >= parameters.starLimit;
      if (match) debugCounts.stars = (debugCounts.stars ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = item.level >= parameters.levelRange[0] && item.level <= parameters.levelRange[1];
      if (match) debugCounts.level = (debugCounts.level ?? 0) + 1;
      return match;
    })
    .filter(({ item }) => {
      const match = parameters.onlyOmnicrafterFriendly ? item.job === 'Omni' : true;
      if (match) debugCounts.omniFriendly = (debugCounts.omniFriendly ?? 0) + 1;
      return match;
    })
    .filter(({ financials }) => {
      const salesPerWeek = financials.saleVelocityPerDay != null ? financials.saleVelocityPerDay * 7 : null;
      const meetsSales = parameters.minSales > 0 ? (salesPerWeek ?? 0) >= parameters.minSales : true;
      const meetsPrice = financials.revenuePerUnit >= parameters.minPrice;
      const meetsProfit = financials.profit >= parameters.minProfit;
      const meetsTime =
        parameters.maxTimeToSell > 0 ? (financials.timeToSellDays ?? Number.MAX_VALUE) <= parameters.maxTimeToSell : true;
      const match = meetsSales && meetsPrice && meetsProfit && meetsTime;
      if (match) debugCounts.financial = (debugCounts.financial ?? 0) + 1;
      return match;
    });

  const results = filtered.sort((a, b) => {
    const selectors: Record<SortKey, number> = {
      name: a.item.name.localeCompare(b.item.name),
      profit: a.financials.profit - b.financials.profit,
      roi: a.financials.roi - b.financials.roi,
      level: a.item.level - b.item.level,
      stars: a.item.stars - b.item.stars,
      yields: a.item.yields - b.item.yields,
      profitPerUnit: a.financials.profitPerUnit - b.financials.profitPerUnit,
      timeToSell: (a.financials.timeToSellDays ?? Number.MAX_VALUE) - (b.financials.timeToSellDays ?? Number.MAX_VALUE)
    } as const;

    const value = parameters.sortKey === 'name' ? selectors.name : selectors[parameters.sortKey];
    return parameters.sortDir === 'asc' ? value : value * -1;
  });

  console.log('[search] Filter pipeline counts', {
    counts: debugCounts,
    final: results.length,
    sortKey: parameters.sortKey,
    sortDir: parameters.sortDir
  });

  return { results, availableCategories };
}

export const defaultSearchParameters: SearchParameters = {
  query: '',
  homeServer: '',
  dataCenter: '',
  categories: [],
  jobFilter: 'any',
  minSales: 0,
  minPrice: 0,
  minProfit: 0,
  minYield: 1,
  starLimit: 0,
  levelRange: [50, 100],
  expertOnly: false,
  onlyOmnicrafterFriendly: false,
  costMode: 'regionalMedian',
  revenueMode: 'regionalMedian',
  blendedListingWeight: 0.35,
  includeVendorPrices: true,
  priceOverrides: {},
  timedNodeOnly: false,
  maxComplexity: 10,
  maxTimeToSell: 0,
  sortKey: 'profit',
  sortDir: 'desc'
};
