# Popz Admin

A content-management admin panel for the Popz OTT catalog — manage titles (movies &
dramas), live streams, and reels. Built with React + TypeScript + Vite.

This is a standalone client-only app: there's no backend, so it seeds itself from mock
catalog data and persists every add/edit/delete to the browser's `localStorage`, keyed
under `popz-admin:*`. It's meant to demonstrate the management UI/UX, not to share live
data with the [roll-now](../roll-now) consumer app.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build locally

## Structure

- `src/pages/` — route-level pages (Dashboard, Titles, Live streams, Reels)
- `src/components/layout/` — sidebar nav, page shell, page header
- `src/components/ui/` — reusable primitives (Button, Badge, DataTable, Modal, form fields, icons)
- `src/components/{titles,live,reels}/` — feature-scoped add/edit forms
- `src/hooks/useCollection.ts` — generic localStorage-backed CRUD hook shared by all three catalogs
- `src/data/` — seed data used the first time each collection loads
- `src/types/catalog.ts` — shared domain types
