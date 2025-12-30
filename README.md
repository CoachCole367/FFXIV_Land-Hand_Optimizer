# FFXIV Land & Hand Optimizer

Next.js app for Craftsim-friendly crafting searches, presets, and settings.

## Run locally

Prerequisites:

- Node.js 20+ and npm
- Optional: SQLite for Prisma (the default `DATABASE_URL` uses a file-based DB)

Setup and start the dev server:

```bash
npm install

# (optional) configure a local database for presets and snapshots
echo "DATABASE_URL=\"file:./prisma/dev.db\"" > .env

# make sure the SQLite folder exists and push the schema (creates the DB file)
npx prisma db push --skip-generate

# generate the Prisma client if you change the schema
npm run prisma:generate

# Tip: if the npm registry is blocked, the generator falls back to an offline
# mock client so development can continue. Set PRISMA_FORCE_MOCK=1 to skip the
# network attempt entirely.

npm run dev
```

The app starts on http://localhost:3000. Hot reload is enabled by default.

Troubleshooting:

- If you see `Unable to open the database file`, ensure the `prisma` directory exists and that `DATABASE_URL` points to a writable path. Running `npx prisma db push --skip-generate` after setting `.env` will create `prisma/dev.db` for you.
- If the Prisma CLI cannot be downloaded (403 or similar), set `PRISMA_FORCE_MOCK=1` before `npm run prisma:generate` to use the offline mock client.

## Production build & deploy

The app now relies on API routes for search and preset hydration, so deploy to a host that runs the Next.js server (Vercel, Fly.io, Render, etc.). If you need a subpath, set the base path before building so assets resolve under the repository scope:

```bash
export NEXT_PUBLIC_BASE_PATH=FFXIV_Land-Hand_Optimizer
npm install
npm run build
npm run start
```

For static-only hosting, build artifacts are not sufficient because `/api` endpoints are required for interactive flows.
