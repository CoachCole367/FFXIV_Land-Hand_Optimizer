# FFXIV Land & Hand Optimizer

Static Next.js UI for Craftsim-friendly crafting searches, presets, and settings.

## GitHub Pages

The site is configured for static export so it can run on GitHub Pages. Set the base path before building so assets resolve under the repository scope:

```bash
export NEXT_PUBLIC_BASE_PATH=FFXIV_Land-Hand_Optimizer
npm install
npm run build
```

The build emits an `out/` directory with a `.nojekyll` marker for Pages. Deploy the contents of `out/` to the `gh-pages` branch (or the pages publishing source you prefer).
