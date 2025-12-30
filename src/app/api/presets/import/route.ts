import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSnapshotData } from '@/lib/marketData';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const presets = (body.presets as any[]) ?? [];

  const created = [] as any[];
  for (const preset of presets) {
    const snapshotData =
      preset.snapshot?.data || preset.data || preset.parameters?.snapshotData || createSnapshotData();
    const snapshotId = preset.snapshotId ?? preset.snapshot?.id;

    const snapshot = snapshotId
      ? await prisma.marketSnapshot.upsert({
          where: { id: snapshotId },
          update: { data: snapshotData, note: preset.snapshot?.note },
          create: { id: snapshotId, data: snapshotData, note: preset.snapshot?.note }
        })
      : await prisma.marketSnapshot.create({ data: { data: snapshotData, note: preset.snapshot?.note } });

    const saved = await prisma.preset.create({
      data: {
        name: preset.name,
        description: preset.description ?? '',
        tags: preset.tags ?? [],
        isDefault: Boolean(preset.isDefault),
        parameters: preset.parameters,
        snapshotId: snapshot.id
      },
      include: { snapshot: true }
    });

    created.push(saved);
  }

  return NextResponse.json({ presets: created });
}
