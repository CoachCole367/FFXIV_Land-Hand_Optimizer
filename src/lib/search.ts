import { MarketSnapshot, Preset } from '@prisma/client';
import { CraftItem, MarketSnapshotData } from './marketData';

type CostMode = 'materialAverage' | 'marketPurchase';
type RevenueMode = 'recentSales' | 'marketBoard';
type SortKey = 'name' | 'profit' | 'roi' | 'level' | 'stars' | 'yields';

export type SearchParameters = {
  query: string;
  homeServer: string;
  region: string;
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
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
};

export type Financials = {
  revenue: number;
  cost: number;
  profit: number;
  roi: number;
  missing: string[];
};

export type SearchResult = {
  item: CraftItem;
  financials: Financials;
};

export type HydratedPreset = Preset & { snapshot: MarketSnapshot };

export function computeFinancials(
  item: CraftItem,
  costMode: CostMode,
  revenueMode: RevenueMode
): Financials {
  const revenueBase = revenueMode === 'recentSales' ? item.recentSalePrice : item.marketPrice;
  const costBase = costMode === 'materialAverage' ? item.materialCost : item.marketPurchaseCost;
  const missing: string[] = [];

  if (revenueBase == null) missing.push('revenue');
  if (costBase == null) missing.push('cost');

  const revenue = (revenueBase ?? 0) * item.yields;
  const cost = costBase ?? 0;
  const profit = revenue - cost;
  const roi = cost > 0 ? profit / cost : 0;

  return { revenue, cost, profit, roi, missing };
}

export function runSearch(
  snapshotData: MarketSnapshotData,
  parameters: SearchParameters
): { results: SearchResult[]; availableCategories: string[] } {
  const items = snapshotData.items;
  const lowerQuery = parameters.query.trim().toLowerCase();
  const availableCategories = Array.from(new Set(items.map((item) => item.category))).sort();

  const filtered = items
    .filter((item) => (!lowerQuery ? true : item.name.toLowerCase().includes(lowerQuery)))
    .filter((item) => (!parameters.homeServer ? true : item.homeServer.toLowerCase().includes(parameters.homeServer.toLowerCase())))
    .filter((item) => (!parameters.region ? true : item.region.toLowerCase().includes(parameters.region.toLowerCase())))
    .filter((item) => (!parameters.dataCenter ? true : item.dataCenter.toLowerCase().includes(parameters.dataCenter.toLowerCase())))
    .filter((item) =>
      parameters.categories.length === 0 ? true : parameters.categories.includes(item.category)
    )
    .filter((item) =>
      parameters.jobFilter === 'any' ? true : item.job === parameters.jobFilter || (parameters.jobFilter === 'Omni' && item.job === 'Omni')
    )
    .filter((item) => (parameters.expertOnly ? item.isExpert : true))
    .filter((item) => item.yields >= parameters.minYield)
    .filter((item) => item.stars >= parameters.starLimit)
    .filter((item) => item.level >= parameters.levelRange[0] && item.level <= parameters.levelRange[1])
    .filter((item) => (parameters.onlyOmnicrafterFriendly ? item.job === 'Omni' : true))
    .filter((item) => {
      const { revenue, cost, profit } = computeFinancials(
        item,
        parameters.costMode,
        parameters.revenueMode
      );
      const meetsSales = revenue >= parameters.minSales;
      const meetsPrice = (revenue / Math.max(item.yields, 1)) >= parameters.minPrice;
      const meetsProfit = profit >= parameters.minProfit;
      return meetsSales && meetsPrice && meetsProfit;
    });

  const results = filtered
    .map((item) => ({
      item,
      financials: computeFinancials(item, parameters.costMode, parameters.revenueMode)
    }))
    .sort((a, b) => {
      const selectors: Record<SortKey, number> = {
        name: a.item.name.localeCompare(b.item.name),
        profit: a.financials.profit - b.financials.profit,
        roi: a.financials.roi - b.financials.roi,
        level: a.item.level - b.item.level,
        stars: a.item.stars - b.item.stars,
        yields: a.item.yields - b.item.yields
      } as const;

      const value = parameters.sortKey === 'name' ? selectors.name : selectors[parameters.sortKey];
      return parameters.sortDir === 'asc' ? value : value * -1;
    });

  return { results, availableCategories };
}

export const defaultSearchParameters: SearchParameters = {
  query: '',
  homeServer: '',
  region: '',
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
  costMode: 'materialAverage',
  revenueMode: 'recentSales',
  sortKey: 'profit',
  sortDir: 'desc'
};
