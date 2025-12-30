import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runSearch, SearchParameters, defaultSearchParameters } from '@/lib/search';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const preset = await prisma.preset.findUnique({
    where: { id: params.id },
    include: { snapshot: true }
  });

  if (!preset) return NextResponse.json({ error: 'Preset not found' }, { status: 404 });

  const snapshotData = preset.snapshot.data as any;
  const parameters: SearchParameters = {
    ...defaultSearchParameters,
    ...(preset.parameters as Partial<SearchParameters>)
  };
  const { results, availableCategories } = runSearch(snapshotData, parameters);

  return NextResponse.json({
    preset,
    snapshotId: preset.snapshotId,
    capturedAt: snapshotData.capturedAt,
    availableCategories,
    results,
    parameters
  });
}
