# Technology

The technology that implements the functional architecture in [`../architecture/`](../architecture/).

## Stack

| Area | Choice | Why |
|---|---|---|
| Licence | Apache License 2.0 | Already in [`LICENSE`](../../LICENSE). |
| Distribution | Open source, public on GitHub | Project goal. |
| Language | TypeScript everywhere | One language for GUI, server, command line and core. |
| Runtime | Node.js 22 LTS | Continues the existing scripts. |
| GUI | Angular 22, standalone components, signals | Project goal. |
| GUI components | Angular Material | Maintained by the Angular team, accessible, no extra styling system. |
| Charts | Apache ECharts via `ngx-echarts` | Interactive scatter, bar and heatmap charts (confusion matrix), with click-through for drill-down. |
| Server | Fastify | Small, fast, schema-validated routes, good TypeScript support. |
| Validation | Zod | One schema per domain concept, shared by GUI, server and files. |
| Live progress | Server-Sent Events | Progress flows one way, from server to GUI. Works through proxies with no extra library. |
| Result store | JSON files on disk | Readable without the app, easy to share and review in git. |
| Command line | Node.js CLI on `packages/core` | Same functions as the GUI. |
| First model server | Ollama | Used by the existing study. |
| Second model server | OpenAI-compatible endpoints | One adapter covers llama.cpp server, vLLM and LM Studio. |
| Package management | npm workspaces | Built into Node.js, no extra tool. |
| Unit tests | Vitest | Core scoring, metrics, store and adapters. |
| End-to-end tests | Playwright | GUI against the server, with a stub model server. |
| Lint and format | ESLint and Prettier | Standard for TypeScript and Angular. |
| CI | GitHub Actions | Lint, test and build on every pull request. |

## Repository layout

```text
apps/
  web/            Angular GUI
  server/         Fastify API: runs, progress stream, store access
  cli/            command line
packages/
  core/           domain model, Zod schemas, scoring, metrics, uncertainty
  providers/      model provider gateway: Ollama, OpenAI-compatible
  store/          result store on JSON files
  profiler/       machine profiler
studies/
  classifier-evaluation/   existing study, moved here
dev/
  architecture/   functional architecture
  planning/       this document
```

`packages/core` has no dependencies on the server, the GUI or the file system. Scoring and metrics
can be tested on their own and reused by every app.

## Result store on disk

```text
studies/<study>/
  study.json                     study definition and versions
  datasets/<version>.json        cases and labels, with fingerprint
  campaigns/<campaign>/
    campaign.json                study version, dataset version, conclusion
    runs/<run-id>/
      run.json                   settings, model variant, machine profile, status, origin
      calls.jsonl                one line per call, appended as each call completes
      scores-<version>.json      one scoring version: dataset version, scores, metrics, excluded cases
```

- Writing calls one per line, in append mode, means a crash loses at most the call in progress.
- Re-scoring writes a new `scores-<version>.json` and never touches `calls.jsonl`.
- Every file is validated against its Zod schema when read and when written.

## Server API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/studies` | List studies. |
| GET, PUT | `/api/studies/:id` | Read or change a study. |
| GET, POST | `/api/studies/:id/datasets` | List dataset versions, or freeze a new one. |
| GET | `/api/models` | Models available on the configured servers. |
| POST | `/api/campaigns` | Plan and queue a campaign. |
| GET | `/api/campaigns/:id` | Campaign with run metrics. |
| POST | `/api/runs/:id/pause`, `/resume`, `/cancel` | Run control. |
| GET | `/api/runs/:id/calls` | Calls with raw answers, for drill-down. |
| POST | `/api/runs/:id/rescore` | Re-score against a dataset version. |
| GET | `/api/events` | Server-Sent Events stream: run progress and status changes. |
| POST | `/api/import`, GET `/api/export/:runId` | Share runs between machines. |

The server listens on `localhost` only by default. It is a local tool, not a hosted service.

## Machine profiler

- Model placement and memory: Ollama `/api/ps`.
- Graphics card: `nvidia-smi` when present. Fields that can't be read are left empty.
- Processor, memory and operating system: Node.js `os` module.
- Model server version: Ollama `/api/version`.

## Migration from today

1. Move `classifier-evaluation/` to `studies/classifier-evaluation/`.
2. Write an importer that converts the existing `classifications-*.json` files into campaigns and
   runs in the new store. The existing files don't record raw model answers or a machine profile,
   so those fields are left empty, and the converted runs get the origin `migrated`.
3. Keep the current scripts working until the new command line covers the same functions, then
   remove them.

## Build order

1. `packages/core`: schemas, classification scoring, metrics and uncertainty, with unit tests.
2. `packages/store` and the importer for the existing results.
3. `packages/providers` (Ollama) and `packages/profiler`.
4. `apps/cli`: run a campaign end to end.
5. `apps/server`: API and progress stream.
6. `apps/web`: results browsing and comparison first, then running campaigns, then dataset
   editing.
7. OpenAI-compatible provider.
