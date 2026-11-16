# GUI

`apps/web` is an Angular 22 application: standalone components, signals, zoneless change
detection, Angular Material and ECharts.

## Routes

| Route | Page | Content |
|---|---|---|
| `/` | Home | Studies, running and queued runs, recent campaigns. |
| `/studies/new` | New study | Name, task type, instruction, output fields, tolerance, defaults. |
| `/studies/:study` | Study | Task definition, versions, models of interest, campaigns. |
| `/studies/:study/dataset` | Dataset | Case table, editor, import, labels, tags. |
| `/studies/:study/dataset/coverage` | Coverage | Counts per group against targets, expected interval width. |
| `/studies/:study/dataset/disagreements` | Disagreements | Cases where labellers differ: confirm, tag ambiguous or remove. |
| `/studies/:study/campaigns/new` | Plan campaign | Dataset version, models, settings to vary, plan preview, start. |
| `/campaigns/:campaign` | Campaign | Results table, accuracy against latency, breakdowns, conclusion, report. |
| `/runs/:run` | Run | Live progress or results, machine profile, disturbance, scoring versions. |
| `/runs/:run/calls` | Calls | Every call with raw answer, filterable. Drill-down target. |
| `/compare` | Compare | Selected runs side by side, with comparability warnings. |
| `/settings` | Settings | Providers and their status, data root, thresholds. Read-only in v1. |

## Page details

### Campaign
- **Results table:** one row per run, with model, varied settings, valid answers, accuracy per
  field, within-N, consistency, median and p95 latency. Accuracy cells show the interval as a bar.
  Rows whose intervals overlap the best row are marked as not clearly different.
- **Accuracy against latency:** scatter plot, one point per run, with interval whiskers. Clicking
  a point opens the run.
- **Breakdowns:** accuracy per label value, per difficulty and per tag, as grouped bars.
- **Confusion matrix:** heatmap per run and field. Clicking a cell opens the calls behind it.
- **Hardest cases:** cases most runs get wrong, linked to the dataset editor.
- **Warnings:** disturbed runs, imported or migrated runs, runs shown with a later scoring
  version.

### Run
- While running: progress bar, current case, time left, live metrics, pause, resume and cancel.
- When done: metrics with intervals, machine profile at start and end, load samples chart,
  disturbance flag with edit, list of scoring versions with a selector.

### Compare
- Pick runs from any campaign. Differences from `comparability()` are shown at the top, for
  example a different dataset version or machine.

## Structure

```text
apps/web/src/app/
  core/          api client, event stream service, error handling
  shared/        interval bar, status chip, warning banner, chart wrappers
  features/
    home/
    studies/
    dataset/
    campaigns/
    runs/
    compare/
    settings/
  app.routes.ts  lazy-loaded feature routes
```

## State and data

- **API access:** one typed client per resource, built on `HttpClient`, with the Zod schemas
  from `packages/core` to validate responses in development builds.
- **State:** signals in feature-level services. No global store library.
- **Live updates:** one `EventStreamService` wraps `EventSource` on `/api/events` and exposes
  events as signals. Pages that show runs update from these events without reloading.
- **Resync:** on a `resync` event, open pages reload their data.

## Charts

- `ngx-echarts` with ECharts loaded on demand, only on pages with charts.
- Every chart has a table view with the same numbers, for accessibility and copying.
- Chart colours come from the Material theme, in light and dark.

## Accessibility and language

- Material components, keyboard navigation throughout, visible focus, WCAG 2.2 AA contrast.
- English only in v1. Text is written so it can be extracted for translation later.

## Build and serve

- `ng build` writes to `apps/web/dist`. The server serves those files in production.
- `npm run dev` starts the server with file watching and `ng serve` with a proxy to the server.
