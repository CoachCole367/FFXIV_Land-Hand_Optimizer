import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSnapshotData } from '@/lib/marketData';
import { defaultSearchParameters, SearchParameters } from '@/lib/search';

async function ensureSnapshot(snapshotId?: string) {
  if (snapshotId) {
    const existing = await prisma.marketSnapshot.findUnique({ where: { id: snapshotId } });
    if (existing) return existing;
  }

  const latest = await prisma.marketSnapshot.findFirst({ orderBy: { createdAt: 'desc' } });
  if (latest) return latest;

  return prisma.marketSnapshot.create({ data: { data: createSnapshotData() } });
}

export async function GET(request: NextRequest) {
  const includeParameters = request.nextUrl.searchParams.get('includeParameters') === 'true';
  const presets = await prisma.preset.findMany({
    orderBy: { createdAt: 'desc' },
    include: { snapshot: true }
  });

  const sanitized = presets.map((preset) => ({
    ...preset,
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
      tags: (body.tags as string[]) ?? [],
      isDefault: Boolean(body.isDefault),
      parameters,
      snapshotId: snapshot.id
    },
    include: { snapshot: true }
  });

  return NextResponse.json({ preset });
}
