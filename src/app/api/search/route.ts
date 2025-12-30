import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSnapshotData } from '@/lib/marketData';
import { defaultSearchParameters, runSearch, SearchParameters } from '@/lib/search';

async function ensureSnapshot(snapshotId?: string) {
  if (snapshotId) {
    const existing = await prisma.marketSnapshot.findUnique({ where: { id: snapshotId } });
    if (existing) return existing;
  }

  const latest = await prisma.marketSnapshot.findFirst({ orderBy: { createdAt: 'desc' } });
  if (latest) return latest;

  return prisma.marketSnapshot.create({ data: { data: createSnapshotData() } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parameters: SearchParameters = {
    ...defaultSearchParameters,
    ...(body.parameters as Partial<SearchParameters>)
  };

  const snapshot = await ensureSnapshot(body.snapshotId as string | undefined);
  const { results, availableCategories } = runSearch(snapshot.data as any, parameters);

  return NextResponse.json({
    snapshotId: snapshot.id,
    capturedAt: (snapshot.data as any).capturedAt,
    parametersUsed: parameters,
    availableCategories,
    results
  });
}
