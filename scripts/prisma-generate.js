#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const CLIENT_DIR = path.join(PROJECT_ROOT, 'node_modules', '@prisma', 'client');
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'mock-db.json');

function log(msg) {
  console.log(`[prisma-generate] ${msg}`);
}

function tryRealGenerate() {
  if (process.env.PRISMA_FORCE_MOCK === '1') return false;
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    return true;
  } catch (err) {
    log('Real Prisma generation failed; falling back to offline mock.');
    return false;
  }
}

function ensureClientDir() {
  fs.mkdirSync(CLIENT_DIR, { recursive: true });
}

function cuid() {
  return 'ck' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { marketSnapshots: [], presets: [] };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    log('Mock DB unreadable; starting fresh.');
    return { marketSnapshots: [], presets: [] };
  }
}

function saveDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function writeClientFiles() {
  ensureClientDir();

  const indexJs = `const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'prisma', 'mock-db.json');

function cuid() {
  return 'ck' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { marketSnapshots: [], presets: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    return { marketSnapshots: [], presets: [] };
  }
}

function saveDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function normalizeDate(value) {
  return value instanceof Date ? value : new Date(value);
}

class MarketSnapshotDelegate {
  constructor(client) {
    this.client = client;
  }

  async findUnique({ where }) {
    const match = this.client._db.marketSnapshots.find((snap) => snap.id === where.id);
    return match ? { ...match, createdAt: normalizeDate(match.createdAt) } : null;
  }

  async findFirst({ orderBy } = {}) {
    const snaps = [...this.client._db.marketSnapshots];
    if (orderBy?.createdAt === 'desc') {
      snaps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    const match = snaps[0];
    return match ? { ...match, createdAt: normalizeDate(match.createdAt) } : null;
  }

  async create({ data }) {
    const record = {
      id: data.id || cuid(),
      createdAt: data.createdAt || new Date().toISOString(),
      note: data.note ?? null,
      data: data.data,
    };
    this.client._db.marketSnapshots.push(record);
    saveDb(this.client._db);
    return { ...record, createdAt: normalizeDate(record.createdAt) };
  }

  async upsert({ where, create, update }) {
    const existing = this.client._db.marketSnapshots.find((snap) => snap.id === where.id);
    if (existing) {
      Object.assign(existing, update);
      saveDb(this.client._db);
      return { ...existing, createdAt: normalizeDate(existing.createdAt) };
    }
    return this.create({ data: { ...create, id: where.id } });
  }
}

class PresetDelegate {
  constructor(client) {
    this.client = client;
  }

  async findMany({ include, where } = {}) {
    let items = [...this.client._db.presets];
    if (where?.snapshotId) {
      items = items.filter((item) => item.snapshotId === where.snapshotId);
    }
    const snapshots = include?.snapshot ? this.client._db.marketSnapshots : null;
    return items.map((item) => {
      const base = { ...item, createdAt: normalizeDate(item.createdAt), updatedAt: normalizeDate(item.updatedAt) };
      if (snapshots) {
        base.snapshot = snapshots.find((snap) => snap.id === item.snapshotId) || null;
      }
      return base;
    });
  }

  async findUnique({ where, include } = {}) {
    const match = this.client._db.presets.find((preset) => preset.id === where.id);
    if (!match) return null;
    const base = { ...match, createdAt: normalizeDate(match.createdAt), updatedAt: normalizeDate(match.updatedAt) };
    if (include?.snapshot) {
      base.snapshot = this.client._db.marketSnapshots.find((snap) => snap.id === match.snapshotId) || null;
    }
    return base;
  }

  async create({ data, include } = {}) {
    const record = {
      id: data.id || cuid(),
      name: data.name,
      description: data.description,
      tags: data.tags ?? null,
      isDefault: data.isDefault ?? false,
      parameters: data.parameters,
      snapshotId: data.snapshotId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.client._db.presets.push(record);
    saveDb(this.client._db);
    return this.findUnique({ where: { id: record.id }, include });
  }

  async updateMany({ data, where } = {}) {
    let count = 0;
    this.client._db.presets = this.client._db.presets.map((preset) => {
      if (where?.isDefault !== undefined && preset.isDefault !== where.isDefault) {
        return preset;
      }
      count += 1;
      return { ...preset, ...data, updatedAt: new Date().toISOString() };
    });
    saveDb(this.client._db);
    return { count };
  }
}

class PrismaClient {
  constructor() {
    this._db = loadDb();
    this.marketSnapshot = new MarketSnapshotDelegate(this);
    this.preset = new PresetDelegate(this);
  }

  async $connect() { return Promise.resolve(); }
  async $disconnect() { return Promise.resolve(); }
}

module.exports = { PrismaClient };
`;

  const indexDts = `export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export type MarketSnapshot = {
  id: string;
  createdAt: Date;
  note: string | null;
  data: JsonValue;
};

export type Preset = {
  id: string;
  name: string;
  description: string;
  tags: JsonValue | null;
  isDefault: boolean;
  parameters: JsonValue;
  snapshotId: string;
  createdAt: Date;
  updatedAt: Date;
  snapshot?: MarketSnapshot | null;
};

export class PrismaClient {
  constructor();
  marketSnapshot: {
    findUnique(args: { where: { id: string } }): Promise<MarketSnapshot | null>;
    findFirst(args?: { orderBy?: { createdAt?: 'asc' | 'desc' } }): Promise<MarketSnapshot | null>;
    create(args: { data: { id?: string; note?: string | null; data: JsonValue; createdAt?: string | Date } }): Promise<MarketSnapshot>;
    upsert(args: { where: { id: string }; create: any; update: any }): Promise<MarketSnapshot>;
  };
  preset: {
    findMany(args?: { include?: { snapshot?: boolean }; where?: { snapshotId?: string } }): Promise<Preset[]>;
    findUnique(args: { where: { id: string }; include?: { snapshot?: boolean } }): Promise<Preset | null>;
    create(args: { data: any; include?: { snapshot?: boolean } }): Promise<Preset | null>;
    updateMany(args: { data: any; where?: { isDefault?: boolean } }): Promise<{ count: number }>;
  };
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}
`;

  fs.writeFileSync(path.join(CLIENT_DIR, 'index.js'), indexJs);
  fs.writeFileSync(path.join(CLIENT_DIR, 'index.d.ts'), indexDts);
}

if (!tryRealGenerate()) {
  const db = loadDb();
  saveDb(db);
  writeClientFiles();
  log('Offline Prisma mock client generated.');
}
