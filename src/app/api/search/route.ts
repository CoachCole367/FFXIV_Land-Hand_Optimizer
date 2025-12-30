import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureMarketSnapshot, MarketSnapshotData } from '@/lib/marketData';
import { defaultSearchParameters, runSearch, SearchParameters } from '@/lib/search';

async function ensureSnapshot(
  snapshotId: string | undefined,
  forceRefresh: boolean | undefined,
  overrides: Record<number, number> | undefined,
  homeWorld: string,
  region: string
) {
  if (snapshotId && !forceRefresh) {
    const existing = await prisma.marketSnapshot.findUnique({ where: { id: snapshotId } });
    if (existing) return existing;
  }

  if (!forceRefresh) {
    const latest = await prisma.marketSnapshot.findFirst({ orderBy: { createdAt: 'desc' } });
    if (latest) {
      const latestData = latest.data as MarketSnapshotData;
      const captured = latestData.capturedAt ? new Date(latestData.capturedAt).getTime() : latest.createdAt.getTime();
      const maxAge = latestData.cacheMs ?? 15 * 60 * 1000;
      if (Date.now() - captured < maxAge) return latest;
    }
  }

  const data = await captureMarketSnapshot({ forceRefresh, overrides, homeWorld, region });
  return prisma.marketSnapshot.create({ data: { data } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parameters: SearchParameters = {
    ...defaultSearchParameters,
    ...(body.parameters as Partial<SearchParameters>)
  };

  const snapshot = await ensureSnapshot(
    body.snapshotId as string | undefined,
    body.forceRefresh,
    parameters.priceOverrides,
    parameters.homeServer || 'Ravana',
    parameters.region || 'Elemental'
  );
  const { results, availableCategories } = runSearch(snapshot.data as any, parameters);

  return NextResponse.json({
    snapshotId: snapshot.id,
    capturedAt: (snapshot.data as any).capturedAt,
    parametersUsed: parameters,
    availableCategories,
    results
  });
}
