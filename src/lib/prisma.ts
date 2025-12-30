import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function ensureSqliteDirectory() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('file:')) return;

  // Support relative paths like file:./prisma/dev.db
  const rawPath = url.replace(/^file:/, '').split('?')[0];
  const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
  const dir = path.dirname(resolvedPath);

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    console.warn(`Unable to ensure SQLite directory at ${dir}:`, error);
  }
}

ensureSqliteDirectory();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
