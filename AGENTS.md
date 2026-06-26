# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project for Ziwei Doushu charting and interpretation. Route pages and API handlers live in `app/`, including `app/chart` and API routes under `app/api/`. Reusable UI lives in `components/` (`components/chart`, `components/insight`, `components/ai`). Domain logic is in `lib/ziwei/`, AI prompt/provider code in `lib/ai/`, SEO helpers in `lib/seo/`, and classical text data in `lib/classics/`. Static and generated build output should stay out of commits (`.next/`, `.open-next/`, `.wrangler/`).

## Build, Test, and Development Commands
- `npm run dev` — start the local Next.js dev server.
- `npm run build` — compile, type-check, and generate production output.
- `npm run start` — serve the production Next build locally.
- `npm run build:cf` — build for Cloudflare via OpenNext.
- `npm run preview:cf` — build and preview the Cloudflare deployment locally.
- `npm run deploy:cf` — build and deploy with OpenNext Cloudflare tooling.

## Coding Style & Naming Conventions
Use TypeScript and React function components. Keep domain calculations in `lib/ziwei` and UI-only behavior in `components`. Prefer explicit interfaces for props and payloads. Use two-space indentation, descriptive camelCase variables/functions, PascalCase components, and route-folder names that match Next.js conventions.

## Testing Guidelines
There is no dedicated test runner configured yet. Treat `npm run build` as the required baseline because it runs compilation and type validation. For API or chart logic changes, add small local smoke scripts or curl checks against `app/api/generate` / `app/api/ziwei-chat`, and document the verified input case.

## Commit & Pull Request Guidelines
Recent history uses short imperative summaries, sometimes with `fix:` or `docs(...)` prefixes. Keep commits focused and explain user-visible impact. PRs should include a concise description, screenshots for UI changes, relevant command output such as `npm run build`, and linked issues or deployment notes when applicable.

## Security & Configuration Tips
Do not commit `.env.local` or provider keys. AI calls are configured through environment variables such as `AI_PROVIDER`, `DEEPSEEK_API_KEY`, or `MIMO_*`; keep request payloads privacy-preserving and avoid sending names, precise locations, or unnecessary birth metadata.
