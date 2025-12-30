'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CraftItem } from '@/lib/marketData';
import { Financials, SearchParameters, defaultSearchParameters } from '@/lib/search';
import { useAppSettings } from '../../providers/AppSettingsProvider';

type SearchResult = {
  item: CraftItem;
  financials: Financials;
};

function formatGil(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function SearchExperience() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(defaultSearchParameters.query);
  const [homeServer, setHomeServer] = useState(defaultSearchParameters.homeServer);
  const [region, setRegion] = useState(defaultSearchParameters.region);
  const [dataCenter, setDataCenter] = useState(defaultSearchParameters.dataCenter);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(defaultSearchParameters.categories);
  const [jobFilter, setJobFilter] = useState<SearchParameters['jobFilter']>(defaultSearchParameters.jobFilter);
  const [minSales, setMinSales] = useState(defaultSearchParameters.minSales);
  const [minPrice, setMinPrice] = useState(defaultSearchParameters.minPrice);
  const [minProfit, setMinProfit] = useState(defaultSearchParameters.minProfit);
  const [minYield, setMinYield] = useState(defaultSearchParameters.minYield);
  const [starLimit, setStarLimit] = useState(defaultSearchParameters.starLimit);
  const [levelRange, setLevelRange] = useState<[number, number]>(defaultSearchParameters.levelRange);
  const [expertOnly, setExpertOnly] = useState(defaultSearchParameters.expertOnly);
  const [costMode, setCostMode] = useState<SearchParameters['costMode']>(defaultSearchParameters.costMode);
  const [revenueMode, setRevenueMode] = useState<SearchParameters['revenueMode']>(defaultSearchParameters.revenueMode);
  const [sortKey, setSortKey] = useState<SearchParameters['sortKey']>(defaultSearchParameters.sortKey);
  const [sortDir, setSortDir] = useState<SearchParameters['sortDir']>(defaultSearchParameters.sortDir);
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CraftItem | null>(null);
  const [onlyOmnicrafterFriendly, setOnlyOmnicrafterFriendly] = useState(
    defaultSearchParameters.onlyOmnicrafterFriendly
  );
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isHydratingPreset, setIsHydratingPreset] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetTags, setPresetTags] = useState('');
  const [presetDefault, setPresetDefault] = useState(false);

  const { compactTable } = useAppSettings();

  const buildParameters = useCallback((): SearchParameters => {
    return {
      query,
      homeServer,
      region,
      dataCenter,
      categories: selectedCategories,
      jobFilter,
      minSales,
      minPrice,
      minProfit,
      minYield,
      starLimit,
      levelRange,
      expertOnly,
      onlyOmnicrafterFriendly,
      costMode,
      revenueMode,
      sortKey,
      sortDir
    };
  }, [
    costMode,
    dataCenter,
    homeServer,
    jobFilter,
    minPrice,
    minProfit,
    minSales,
    minYield,
    query,
    region,
    revenueMode,
    selectedCategories,
    sortDir,
    sortKey,
    starLimit,
    levelRange,
    expertOnly,
    onlyOmnicrafterFriendly
  ]);

  const applyParameters = useCallback(
    (parameters: SearchParameters) => {
      setQuery(parameters.query);
      setHomeServer(parameters.homeServer);
      setRegion(parameters.region);
      setDataCenter(parameters.dataCenter);
      setSelectedCategories(parameters.categories);
      setJobFilter(parameters.jobFilter);
      setMinSales(parameters.minSales);
      setMinPrice(parameters.minPrice);
      setMinProfit(parameters.minProfit);
      setMinYield(parameters.minYield);
      setStarLimit(parameters.starLimit);
      setLevelRange(parameters.levelRange);
      setExpertOnly(parameters.expertOnly);
      setOnlyOmnicrafterFriendly(parameters.onlyOmnicrafterFriendly);
      setCostMode(parameters.costMode);
      setRevenueMode(parameters.revenueMode);
      setSortKey(parameters.sortKey);
      setSortDir(parameters.sortDir);
    },
    []
  );

  const toggleSort = (key: SearchParameters['sortKey']) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const runSearch = useCallback(
    async (parameters?: SearchParameters, snapshotOverride?: string | null) => {
      setIsSearching(true);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: parameters ?? buildParameters(),
          snapshotId: snapshotOverride ?? snapshotId
        })
      });

      if (!res.ok) {
        setMessage('Failed to refresh search results.');
        setIsSearching(false);
        return;
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setAvailableCategories(data.availableCategories ?? []);
      setSnapshotId(data.snapshotId);
      setCapturedAt(data.capturedAt ?? null);
      setIsSearching(false);
    },
    [buildParameters, snapshotId]
  );

  const loadPreset = useCallback(
    async (id: string) => {
      setIsHydratingPreset(true);
      const res = await fetch(`/api/presets/${id}`);
      if (!res.ok) {
        setMessage('Failed to hydrate preset.');
        setIsHydratingPreset(false);
        return;
      }

      const data = await res.json();
      const parameters = data.parameters as SearchParameters;
      applyParameters(parameters);
      setResults(data.results ?? []);
      setAvailableCategories(data.availableCategories ?? []);
      setSnapshotId(data.snapshotId ?? null);
      setCapturedAt(data.capturedAt ?? null);
      setPage(1);
      setActivePresetId(id);
      setIsHydratingPreset(false);
    },
    [applyParameters]
  );

  useEffect(() => {
    const presetId = searchParams.get('presetId');
    if (presetId) {
      loadPreset(presetId);
    } else {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHydratingPreset) return;
    runSearch();
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
    revenueMode,
    sortKey,
    sortDir,
    isHydratingPreset,
    runSearch
  ]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const pagedItems = results.slice((page - 1) * pageSize, page * pageSize);

  const clearPresetForm = () => {
    setPresetName('');
    setPresetDescription('');
    setPresetTags('');
    setPresetDefault(false);
  };

  const savePreset = async () => {
    const payload = {
      name: presetName || 'Untitled preset',
      description: presetDescription,
      tags: presetTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      isDefault: presetDefault,
      parameters: buildParameters(),
      snapshotId
    };

    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      setMessage('Unable to save preset.');
      return;
    }

    setMessage('Preset saved. Copy the share link from the Presets page.');
    clearPresetForm();
  };

  const summaryText = useMemo(() => {
    if (activePresetId) {
      return `Hydrated from preset ${activePresetId}`;
    }
    if (snapshotId) {
      return `Snapshot ${snapshotId.slice(0, 8)}…`;
    }
    return 'Live search';
  }, [activePresetId, snapshotId]);

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="section-title">Craftsim Search</h2>
            <p className="muted">Search by server, filters, and profitability with ROI calculations that respect yields.</p>
            <p className="muted" style={{ marginTop: '0.35rem' }}>
              {summaryText}
              {capturedAt && ` • Snapshot captured ${new Date(capturedAt).toLocaleString()}`}
            </p>
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
            <select value={costMode} onChange={(e) => setCostMode(e.target.value as SearchParameters['costMode'])}>
              <option value="materialAverage">Material average (Craftsim)</option>
              <option value="marketPurchase">Market purchase</option>
            </select>
          </label>
          <label>
            Revenue mode
            <select value={revenueMode} onChange={(e) => setRevenueMode(e.target.value as SearchParameters['revenueMode'])}>
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
                    onChange={(e) => setSelectedCategories(Array.from(e.target.selectedOptions).map((opt) => opt.value))}
                    style={{ minHeight: '120px' }}
                  >
                    {availableCategories.map((cat) => (
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
                  <input type="number" min={0} value={minProfit} onChange={(e) => setMinProfit(Number(e.target.value))} />
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
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0 }}>Results ({results.length})</h3>
            <p className="muted" style={{ marginTop: '0.25rem' }}>
              Sorting by {sortKey} ({sortDir}). Profit and ROI respect yields and cost/revenue modes.
            </p>
            {message && <p className="muted">{message}</p>}
          </div>
          <div className="row" style={{ gap: '0.5rem' }}>
            <label className="switch">
              <input
                type="checkbox"
                checked={sortDir === 'asc'}
                onChange={(e) => setSortDir(e.target.checked ? 'asc' : 'desc')}
              />
              <span>Ascending</span>
            </label>
            <button className="ghost" onClick={() => runSearch()}>Refresh with snapshot</button>
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
              {pagedItems.map(({ item, financials }) => {
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
                    <td>{Number.isFinite(financials.roi) ? `${(financials.roi * 100).toFixed(1)}%` : '—'}</td>
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

        <div className="row" style={{ marginTop: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="muted">
            Showing {pagedItems.length} of {results.length} entries {isSearching && '(refreshing…)'}
          </div>
          <div className="pagination">
            <button className="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button className="ghost" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Save current search as preset</h3>
            <p className="muted" style={{ marginTop: '0.25rem' }}>
              Presets store parameters and the market snapshot so the shareable link replays identical results.
            </p>
          </div>
          <Link className="tag" href="/presets">
            Manage presets
          </Link>
        </div>
        <div className="input-grid" style={{ marginTop: '0.5rem' }}>
          <label>
            Name
            <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Raid consumables" />
          </label>
          <label>
            Description
            <input
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              placeholder="Culinarian HQ foods sorted by ROI"
            />
          </label>
          <label>
            Tags (comma separated)
            <input value={presetTags} onChange={(e) => setPresetTags(e.target.value)} placeholder="recent sales,omnicrafter" />
          </label>
          <label className="switch" style={{ alignSelf: 'flex-end' }}>
            <input type="checkbox" checked={presetDefault} onChange={(e) => setPresetDefault(e.target.checked)} />
            <span>Mark as default preset</span>
          </label>
        </div>
        <button className="ghost" onClick={savePreset} style={{ marginTop: '0.5rem' }}>
          Save preset with snapshot
        </button>
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
