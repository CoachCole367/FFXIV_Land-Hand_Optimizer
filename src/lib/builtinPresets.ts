import { defaultSearchParameters, SearchParameters } from './search';

export type BuiltinPreset = {
  name: string;
  description: string;
  tags: string[];
  isDefault?: boolean;
  parameters: Partial<SearchParameters>;
};

export const builtinPresets: BuiltinPreset[] = [
  {
    name: 'Omnicrafter quick flips',
    description: 'High-velocity Omni-friendly crafts using min listings for costs and home-world minimums for revenue.',
    tags: ['omni', 'velocity', 'roi'],
    parameters: {
      jobFilter: 'Omni',
      onlyOmnicrafterFriendly: true,
      costMode: 'minListing',
      revenueMode: 'homeMin',
      minSales: 30,
      minProfit: 20000,
      maxTimeToSell: 10,
      dataCenter: 'Primal'
    }
  },
  {
    name: 'High-margin crafter picks',
    description: 'Median-based costs, regional median revenue, and stronger profit floors for quieter markets.',
    tags: ['profit', 'median', 'roi'],
    parameters: {
      jobFilter: 'DoH',
      costMode: 'regionalMedian',
      revenueMode: 'regionalMedian',
      minProfit: 75000,
      minSales: 10,
      starLimit: 1,
      levelRange: [80, 100],
      dataCenter: 'Aether'
    }
  },
  {
    name: 'Budget leveling crafts',
    description: 'Lower-cost crafts for leveling with relaxed sales velocity and capped material spend.',
    tags: ['leveling', 'budget'],
    parameters: {
      jobFilter: 'any',
      costMode: 'regionalAverage',
      revenueMode: 'regionalAverage',
      minSales: 5,
      minProfit: 5000,
      minPrice: 1000,
      maxComplexity: 6,
      levelRange: [50, 80],
      dataCenter: 'Crystal'
    }
  }
].map((preset) => ({
  ...preset,
  parameters: { ...defaultSearchParameters, ...preset.parameters }
}));
