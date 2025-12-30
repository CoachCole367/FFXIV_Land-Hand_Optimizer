# FFXIV Land & Hand Optimizer

Static Next.js UI for Craftsim-friendly crafting searches, presets, and settings.

## Run locally

Prerequisites:

- Node.js 20+ and npm
- Optional: SQLite for Prisma (the default `DATABASE_URL` uses a file-based DB)

Setup and start the dev server:

```bash
npm install

# (optional) configure a local database for presets and snapshots
echo "DATABASE_URL=\"file:./prisma/dev.db\"" > .env

# generate the Prisma client if you change the schema
npm run prisma:generate

# Tip: if the npm registry is blocked, the generator falls back to an offline
# mock client so development can continue. Set PRISMA_FORCE_MOCK=1 to skip the
# network attempt entirely.

npm run dev
```

The app starts on http://localhost:3000. Hot reload is enabled by default.

## GitHub Pages

The site is configured for static export so it can run on GitHub Pages. Set the base path before building so assets resolve under the repository scope:

```bash
export NEXT_PUBLIC_BASE_PATH=FFXIV_Land-Hand_Optimizer
npm install
npm run build
```

The build emits an `out/` directory with a `.nojekyll` marker for Pages. Deploy the contents of `out/` to the `gh-pages` branch (or the pages publishing source you prefer).
