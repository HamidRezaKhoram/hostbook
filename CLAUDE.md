# Hostbook: notes for Claude

Phone-first, one-page party-hosting app on GitHub Pages. Status: M1 (app shell) done and deployed; next is M2 (domain core). Live at https://hamidrezakhoram.github.io/hostbook/.

- Read first: `docs/planning/roadmap.md` (what's next + open questions), then `product-spec.md`, `architecture.md`, `data-model.md`, `ui-guidelines.md`.
- Follow `CONTRIBUTING.md` exactly: run `./scripts/test-all.sh` before and after every change; UI fixes need a Playwright phone-profile test that fails on old code first.
- Numbers (calculator, arrival offsets) and templates come from `docs/guide/`. Change doc and code together.
- Domain logic in `src/domain/` stays pure. Share links must never include other guests' data or host notes.
- Stack: Vite + Preact + TS strict, plain CSS tokens, hash routing, IndexedDB, vite-plugin-pwa, base path `/hostbook/`.
- No Node on the host: run everything via `scripts/ct.sh` / `scripts/test-all.sh` (Playwright 1.49.1 container).
- Owner decisions (2026-11-23): Firebase RTDB for live sharing (ADR-010; the owner must create the project, see roadmap), public repo, Canadian units/locale (ADR-011).
