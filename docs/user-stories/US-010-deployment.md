# US-010 — GitHub Pages Deployment

**Status:** ✅ Complete

## Story

As a road designer,
I want to access the tool from any device via a browser without installing anything,
so that I can use it in the office, on-site, or share it with colleagues.

## Acceptance Criteria

- [x] Application is hosted publicly on GitHub Pages
- [x] Deployment is automated — triggers on every push to `main` (direct push or merge from another branch)
- [x] Deployment does not trigger on pushes to other branches
- [x] Build pipeline: checkout → Node 20 → `npm ci` → `npm run build` → deploy `dist/`
- [x] Vite base path set to `/road-geometry-checker/` so assets load correctly on the subdirectory URL
- [x] No server-side components — fully static, all processing in the browser

## Notes

- GitHub Actions workflow at `.github/workflows/deploy.yml`
- GitHub Pages source must be set to "GitHub Actions" in repository Settings → Pages
- `npm ci` is used instead of `npm install` for reproducible CI installs
- All npm dependencies are bundled by Vite at build time — nothing is fetched at runtime
