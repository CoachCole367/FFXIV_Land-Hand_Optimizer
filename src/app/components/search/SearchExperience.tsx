'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAppSettings } from '../../providers/AppSettingsProvider';

type CostMode = 'materialAverage' | 'marketPurchase';
type RevenueMode = 'recentSales' | 'marketBoard';

type CraftItem = {
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

const mockItems: CraftItem[] = [
  {
    id: 1,
    name: 'Indagator\'s Alembic',
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

type SortKey = 'name' | 'profit' | 'roi' | 'level' | 'stars' | 'yields';

type Financials = {
  revenue: number;
  cost: number;
  profit: number;
  roi: number;
  missing: string[];
};

function computeFinancials(item: CraftItem, costMode: CostMode, revenueMode: RevenueMode): Financials {
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

function formatGil(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function SearchExperience() {
  const [query, setQuery] = useState('');
  const [homeServer, setHomeServer] = useState('');
  const [region, setRegion] = useState('');
  const [dataCenter, setDataCenter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [jobFilter, setJobFilter] = useState<'any' | 'DoH' | 'Omni'>('any');
  const [minSales, setMinSales] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [minProfit, setMinProfit] = useState(0);
  const [minYield, setMinYield] = useState(1);
  const [starLimit, setStarLimit] = useState(0);
  const [levelRange, setLevelRange] = useState<[number, number]>([50, 100]);
  const [expertOnly, setExpertOnly] = useState(false);
  const [costMode, setCostMode] = useState<CostMode>('materialAverage');
  const [revenueMode, setRevenueMode] = useState<RevenueMode>('recentSales');
  const [sortKey, setSortKey] = useState<SortKey>('profit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CraftItem | null>(null);
  const [onlyOmnicrafterFriendly, setOnlyOmnicrafterFriendly] = useState(false);

  const { compactTable } = useAppSettings();

  const categories = useMemo(() => Array.from(new Set(mockItems.map((item) => item.category))).sort(), []);

  const filteredItems = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return mockItems
      .filter((item) => (!lowerQuery ? true : item.name.toLowerCase().includes(lowerQuery)))
      .filter((item) => (!homeServer ? true : item.homeServer.toLowerCase().includes(homeServer.toLowerCase())))
      .filter((item) => (!region ? true : item.region.toLowerCase().includes(region.toLowerCase())))
      .filter((item) => (!dataCenter ? true : item.dataCenter.toLowerCase().includes(dataCenter.toLowerCase())))
      .filter((item) => (selectedCategories.length === 0 ? true : selectedCategories.includes(item.category)))
      .filter((item) => (jobFilter === 'any' ? true : item.job === jobFilter || (jobFilter === 'Omni' && item.job === 'Omni')))
      .filter((item) => (expertOnly ? item.isExpert : true))
      .filter((item) => item.yields >= minYield)
      .filter((item) => item.stars >= starLimit)
      .filter((item) => item.level >= levelRange[0] && item.level <= levelRange[1])
      .filter((item) => (onlyOmnicrafterFriendly ? item.job === 'Omni' : true))
      .filter((item) => {
        const { revenue, cost, profit } = computeFinancials(item, costMode, revenueMode);
        const meetsSales = revenue >= minSales;
        const meetsPrice = (revenue / Math.max(item.yields, 1)) >= minPrice;
        const meetsProfit = profit >= minProfit;
        return meetsSales && meetsPrice && meetsProfit;
      });
  }, [
    query,
    homeServer,
    region,
    dataCenter,
    selectedCategories,
    jobFilter,
    expertOnly,
    minYield,
    starLimit,
    levelRange,
    onlyOmnicrafterFriendly,
    minSales,
    minPrice,
    minProfit,
    costMode,
    revenueMode
  ]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const fa = computeFinancials(a, costMode, revenueMode);
      const fb = computeFinancials(b, costMode, revenueMode);

      const selectors: Record<SortKey, number> = {
        name: a.name.localeCompare(b.name),
        profit: fa.profit - fb.profit,
        roi: fa.roi - fb.roi,
        level: a.level - b.level,
        stars: a.stars - b.stars,
        yields: a.yields - b.yields
      } as const;

      const value = sortKey === 'name' ? selectors.name : selectors[sortKey];
      return sortDir === 'asc' ? value : value * -1;
    });
  }, [filteredItems, sortKey, sortDir, costMode, revenueMode]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const pagedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="section-title">Craftsim Search</h2>
            <p className="muted">Search by server, filters, and profitability with ROI calculations that respect yields.</p>
          </div>
          <button className="ghost" onClick={() => setShowAdvanced((prev) => !prev)}>
            {showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}
          </button>
        </div>

        <div className="input-grid" style={{ marginTop: '0.75rem' }}>
          <label>
            Search
            <input placeholder="Item name, ingredient, etc." value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            Home server
            <input placeholder="Ravana" value={homeServer} onChange={(e) => setHomeServer(e.target.value)} />
          </label>
          <label>
            Region/DC
            <input placeholder="Aether / Primal" value={region} onChange={(e) => setRegion(e.target.value)} />
          </label>
          <label>
            Data center
            <input placeholder="Primal" value={dataCenter} onChange={(e) => setDataCenter(e.target.value)} />
          </label>
          <label>
            Cost mode
            <select value={costMode} onChange={(e) => setCostMode(e.target.value as CostMode)}>
              <option value="materialAverage">Material average (Craftsim)</option>
              <option value="marketPurchase">Market purchase</option>
            </select>
          </label>
          <label>
            Revenue mode
            <select value={revenueMode} onChange={(e) => setRevenueMode(e.target.value as RevenueMode)}>
              <option value="recentSales">Recent sales</option>
              <option value="marketBoard">Market board listings</option>
            </select>
          </label>
        </div>

        {showAdvanced && (
          <div className="grid" style={{ marginTop: '1rem' }}>
            <div className="subtle-card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>Advanced filters</strong>
                  <p className="muted" style={{ marginTop: '0.25rem' }}>
                    Categories, omni-friendly, level band, and sales thresholds.
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={onlyOmnicrafterFriendly}
                    onChange={(e) => setOnlyOmnicrafterFriendly(e.target.checked)}
                  />
                  <span>Omnicrafter-friendly</span>
                </label>
              </div>

              <div className="input-grid" style={{ marginTop: '0.75rem' }}>
                <label>
                  Categories
                  <select
                    multiple
                    value={selectedCategories}
                    onChange={(e) =>
                      setSelectedCategories(Array.from(e.target.selectedOptions).map((opt) => opt.value))
                    }
                    style={{ minHeight: '120px' }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  DoH / Omni
                  <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value as typeof jobFilter)}>
                    <option value="any">Any</option>
                    <option value="DoH">DoH only</option>
                    <option value="Omni">Omnicrafter</option>
                  </select>
                </label>
                <label>
                  Minimum recent sales (gil)
                  <input
                    type="number"
                    min={0}
                    value={minSales}
                    onChange={(e) => setMinSales(Number(e.target.value))}
                  />
                </label>
                <label>
                  Minimum price per unit
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                  />
                </label>
                <label>
                  Minimum profit
                  <input
                    type="number"
                    min={0}
                    value={minProfit}
                    onChange={(e) => setMinProfit(Number(e.target.value))}
                  />
                </label>
                <label>
                  Minimum yields per craft
                  <input
                    type="number"
                    min={1}
                    value={minYield}
                    onChange={(e) => setMinYield(Number(e.target.value))}
                  />
                </label>
                <label>
                  Minimum stars
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={starLimit}
                    onChange={(e) => setStarLimit(Number(e.target.value))}
                  />
                </label>
                <label>
                  Level range ({levelRange[0]} - {levelRange[1]})
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={levelRange[0]}
                    onChange={(e) => setLevelRange([Number(e.target.value), levelRange[1]])}
                  />
                  <input
                    type="range"
                    min={levelRange[0]}
                    max={100}
                    value={levelRange[1]}
                    onChange={(e) => setLevelRange([levelRange[0], Number(e.target.value)])}
                  />
                </label>
                <label className="switch" style={{ alignSelf: 'flex-end' }}>
                  <input type="checkbox" checked={expertOnly} onChange={(e) => setExpertOnly(e.target.checked)} />
                  <span>Expert recipes only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>Results ({filteredItems.length})</h3>
            <p className="muted" style={{ marginTop: '0.25rem' }}>
              Sorting by {sortKey} ({sortDir}). Profit and ROI respect yields and cost/revenue modes.
            </p>
          </div>
          <div className="row">
            <label className="switch">
              <input
                type="checkbox"
                checked={sortDir === 'asc'}
                onChange={(e) => setSortDir(e.target.checked ? 'asc' : 'desc')}
              />
              <span>Ascending</span>
            </label>
          </div>
        </div>

        <div className="table-shell" style={{ marginTop: '0.5rem' }}>
          <table className={`table ${compactTable ? 'compact' : ''}`}>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>Item</th>
                <th onClick={() => toggleSort('level')}>Lvl/Stars</th>
                <th onClick={() => toggleSort('yields')}>Yields</th>
                <th>Cost ({costMode})</th>
                <th>Revenue ({revenueMode})</th>
                <th onClick={() => toggleSort('profit')}>Profit</th>
                <th onClick={() => toggleSort('roi')}>ROI</th>
                <th>Links</th>
                <th>Warnings</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => {
                const financials = computeFinancials(item, costMode, revenueMode);
                const warnings = financials.missing;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <strong style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                          {item.name}
                        </strong>
                        <span className="muted">{item.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="row">
                        <span className="chip">Lvl {item.level}</span>
                        <span className="chip">{item.stars}★</span>
                        {item.isExpert && <span className="tag">Expert</span>}
                      </div>
                    </td>
                    <td>
                      <div className="row">
                        <span className="chip">x{item.yields}</span>
                        <span className="muted">{item.job}</span>
                      </div>
                    </td>
                    <td>
                      {financials.cost || financials.cost === 0 ? `${formatGil(financials.cost)} gil` : '—'}
                    </td>
                    <td>
                      {financials.revenue || financials.revenue === 0
                        ? `${formatGil(financials.revenue)} gil`
                        : '—'}
                    </td>
                    <td>
                      <span style={{ color: financials.profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {formatGil(financials.profit)} gil
                      </span>
                    </td>
                    <td>
                      {Number.isFinite(financials.roi) ? `${(financials.roi * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td>
                      <div className="row">
                        <Link href={`https://xivapi.com/item/${item.id}`} className="tag" target="_blank">
                          Item
                        </Link>
                        <Link href={item.universalisUrl} className="tag" target="_blank">
                          Universalis
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="row">
                        {warnings.length > 0 && <span className="badge-warning">Missing {warnings.join(' & ')}</span>}
                        {!warnings.length && <span className="muted">OK</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="row" style={{ marginTop: '0.75rem', justifyContent: 'space-between' }}>
          <div className="muted">Showing {pagedItems.length} of {filteredItems.length} entries</div>
          <div className="pagination">
            <button className="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              className="ghost"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedItem.name}</h3>
                <p className="muted" style={{ marginTop: '0.3rem' }}>
                  {selectedItem.category} • Lvl {selectedItem.level} • {selectedItem.stars}★
                </p>
              </div>
              <button className="ghost" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>

            <div className="grid" style={{ marginTop: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="subtle-card">
                <strong>Location</strong>
                <p className="muted" style={{ marginTop: '0.25rem' }}>
                  {selectedItem.homeServer} • {selectedItem.dataCenter} ({selectedItem.region})
                </p>
              </div>
              <div className="subtle-card">
                <strong>Yield & job</strong>
                <p className="muted" style={{ marginTop: '0.25rem' }}>
                  {selectedItem.job} • Yields x{selectedItem.yields} {selectedItem.isExpert ? '• Expert recipe' : ''}
                </p>
              </div>
              <div className="subtle-card">
                <strong>Links</strong>
                <div className="row" style={{ marginTop: '0.35rem' }}>
                  <Link href={`https://xivapi.com/item/${selectedItem.id}`} className="tag" target="_blank">
                    Item page
                  </Link>
                  <Link href={selectedItem.universalisUrl} className="tag" target="_blank">
                    Universalis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
