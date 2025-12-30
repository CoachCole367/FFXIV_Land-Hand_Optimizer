import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureMarketSnapshot, MarketSnapshotData } from '@/lib/marketData';
import { defaultSearchParameters, SearchParameters } from '@/lib/search';
import { builtinPresets } from '@/lib/builtinPresets';

async function ensureSnapshot(snapshotId?: string) {
  if (snapshotId) {
    const existing = await prisma.marketSnapshot.findUnique({ where: { id: snapshotId } });
    if (existing) return existing;
  }

  const latest = await prisma.marketSnapshot.findFirst({ orderBy: { createdAt: 'desc' } });
  if (latest) {
    const data = latest.data as MarketSnapshotData;
    const capturedAt = data.capturedAt ? new Date(data.capturedAt).getTime() : latest.createdAt.getTime();
    if (Date.now() - capturedAt < (data.cacheMs ?? 12 * 60 * 1000)) return latest;
  }

  const data = await captureMarketSnapshot();
  return prisma.marketSnapshot.create({ data: { data } });
}

async function ensureBuiltinPresets() {
  const existing = await prisma.preset.findMany({ where: { name: { in: builtinPresets.map((p) => p.name) } } });
  const existingNames = new Set(existing.map((preset) => preset.name));
  const snapshot = await ensureSnapshot();

  for (const preset of builtinPresets) {
    if (existingNames.has(preset.name)) continue;
    await prisma.preset.create({
      data: {
        name: preset.name,
        description: preset.description,
        tags: preset.tags,
        isDefault: Boolean(preset.isDefault),
        parameters: preset.parameters as SearchParameters,
        snapshotId: snapshot.id
      }
    });
  }
}

export async function GET(request: NextRequest) {
  const includeParameters = request.nextUrl.searchParams.get('includeParameters') === 'true';
  await ensureBuiltinPresets();
  const presets = await prisma.preset.findMany({
    orderBy: { createdAt: 'desc' },
    include: { snapshot: true }
  });

  const sanitized = presets.map((preset) => ({
    ...preset,
    tags: Array.isArray(preset.tags) ? preset.tags.map((tag) => String(tag)) : [],
    parameters: includeParameters ? preset.parameters : undefined
  }));

  return NextResponse.json({ presets: sanitized });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parameters: SearchParameters = {
    ...defaultSearchParameters,
    ...(body.parameters as Partial<SearchParameters>)
  };

  const snapshot = await ensureSnapshot(body.snapshotId as string | undefined);

  if (body.isDefault) {
    await prisma.preset.updateMany({ data: { isDefault: false }, where: { isDefault: true } });
  }

  const preset = await prisma.preset.create({
    data: {
      name: body.name,
      description: body.description ?? '',
      tags: Array.isArray(body.tags) ? (body.tags as unknown[]).map((tag) => String(tag)) : [],
      isDefault: Boolean(body.isDefault),
      parameters,
      snapshotId: snapshot.id
    },
    include: { snapshot: true }
  });

  return NextResponse.json({ preset });
}
