import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  const presets = await prisma.preset.findMany({ include: { snapshot: true } });
  return NextResponse.json({ presets });
}
