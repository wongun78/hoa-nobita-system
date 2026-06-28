# Hoà Nobita Frontend

React/Vite frontend for the Hoà Nobita Korean Platform.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run typecheck` — run TypeScript checks
- `npm run lint` — run oxlint
- `npm run build` — build production assets
- `npm run preview` — preview production build

## Structure

- `src/App.tsx` — small provider/router entrypoint
- `src/app/` — router and top-level providers
- `src/components/` — layout, UI primitives, system states
- `src/features/auth/` — auth provider, context, hook
- `src/i18n/` — VI/KO dictionaries and provider
- `src/pages/` — focused route page modules
- `src/lib/api.ts` — Axios API client
