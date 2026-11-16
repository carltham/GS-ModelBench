# Quality

## Code standards

- TypeScript `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- No `any` without a comment saying why. Enforced by ESLint.
- Prettier formats everything. CI fails on unformatted code.
- Public functions in packages have a one-line doc comment.
- Values crossing a boundary (files, HTTP, model answers) are parsed with Zod. Inside the code,
  types are trusted.

## Tests

| Level | Tool | Scope | Target |
|---|---|---|---|
| Unit | Vitest | `packages/core`: parsing, scoring, metrics, Wilson intervals, coverage, fingerprint, comparability, re-score eligibility | 90% line coverage |
| Unit | Vitest | `packages/store` on temporary folders: atomic writes, cut-off last line, locking, export and import | 85% |
| Integration | Vitest + stub provider | `packages/providers`: both adapters, streaming, timeouts, server errors | all adapter methods |
| Integration | Vitest + stub provider | `packages/runner`: full run, pause, resume, cancel, crash recovery, failure after errors, re-score | all run statuses |
| Integration | Vitest + `fastify.inject` | `apps/server`: every endpoint, validation errors, event stream with `Last-Event-ID` | every endpoint |
| Component | Vitest + Angular testing | `apps/web`: tables, interval bars, warnings, forms | key components |
| End to end | Playwright | Server + GUI + stub provider: create study, import cases, freeze, plan, run, watch live, compare, re-score, export | the seven workflows in [`workflows.md`](../architecture/workflows.md) |

## Golden test

The migration of the original classifier results must reproduce the published numbers. For each
of the four original result files, the metrics computed by `packages/core` from the migrated
runs must equal the stored `validJsonPct`, `kindAccuracyPct`, `difficultyExactPct`,
`difficultyWithinOnePct`, `consistentPct`, `medianMs` and `p95Ms`, after the same rounding.
`packages/core` uses the original percentile definition (sorted values, index
`floor(n × p)`, capped at the last value) so latency matches too.
This test protects the scoring from changing meaning.

## Continuous integration

GitHub Actions, on every pull request and on pushes to `main`:

1. `npm ci`
2. `npm run lint` (ESLint and Prettier check)
3. `npm run typecheck`
4. `npm test` (unit and integration, with coverage)
5. `npm run build` (all packages and the GUI)
6. `npm run e2e` (Playwright, Chromium)

- Node.js 22 on Ubuntu for every step. Unit and integration tests also run on Windows and macOS
  once a week.
- A pull request can only be merged when all steps pass.
- No test in CI talks to a real model server.
