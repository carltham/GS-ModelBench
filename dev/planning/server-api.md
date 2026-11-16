# Server API

`apps/server` is a Fastify server. It serves the API under `/api` and the built Angular GUI from
`/`. Request and response bodies are JSON validated by the Zod schemas in `packages/core`.

## Defaults

- Listens on `127.0.0.1:4300`. It is a local tool, so it has no login.
- Listening on another address requires `--host` and prints a warning that the API has no
  authentication.
- No CORS headers. The GUI is served from the same origin. In development, the Angular dev
  server proxies `/api` to port 4300.
- Errors use one shape: `{ "error": { "code": "string", "message": "string", "details": {} } }`.

## Endpoints

### Studies
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/studies` | List studies with summary: cases, campaigns, last run. |
| POST | `/api/studies` | Create a study. |
| GET | `/api/studies/:study` | Study with all versions. |
| PUT | `/api/studies/:study` | Change a study. A changed task adds a study version. |

### Datasets
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/studies/:study/datasets` | Dataset versions with fingerprints and case counts. |
| GET | `/api/studies/:study/datasets/:version` | One frozen version. |
| GET, PUT | `/api/studies/:study/draft` | Read or replace the draft. |
| POST | `/api/studies/:study/draft/import` | Import cases: JSON, JSON Lines or CSV. Optional tag. |
| GET | `/api/studies/:study/draft/coverage` | Coverage check and expected interval width. |
| GET | `/api/studies/:study/draft/disagreements` | Cases where labellers disagree. |
| POST | `/api/studies/:study/draft/freeze` | Freeze the draft as the next dataset version. |

### Models
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/providers` | Configured providers and whether they are reachable. |
| GET | `/api/providers/:provider/models` | Models available, with variants. |

### Campaigns and runs
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/campaigns/plan` | Plan only: runs, calls, estimated duration. Writes nothing. |
| POST | `/api/campaigns` | Create the campaign and queue its runs. |
| GET | `/api/studies/:study/campaigns` | Campaigns of a study. |
| GET | `/api/campaigns/:campaign` | Campaign with each run's displayed metrics. |
| PUT | `/api/campaigns/:campaign/conclusion` | Store or replace the conclusion. |
| GET | `/api/runs/:run` | Run, with machine profile and scoring versions. |
| GET | `/api/runs/:run/calls` | Calls, filterable by case, state, field value. Paged. |
| GET | `/api/runs/:run/scores/:version` | One scoring version. |
| POST | `/api/runs/:run/pause` | Pause. |
| POST | `/api/runs/:run/resume` | Resume. |
| POST | `/api/runs/:run/cancel` | Cancel. |
| PUT | `/api/runs/:run/disturbance` | Set or clear the disturbance flag, with a note. |
| POST | `/api/runs/:run/rescore` | Body `{ datasetVersion }`. Creates a scoring version. |
| DELETE | `/api/runs/:run` | Header `X-Confirm-Delete: <run id>` required. |
| GET | `/api/queue` | Queued run ids in order. |

### Comparison and reports
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/compare?runs=a,b,c` | Metrics side by side, with comparability warnings. |
| POST | `/api/campaigns/:campaign/report` | Generate the Markdown report and SVG charts. |
| GET | `/api/campaigns/:campaign/report/*` | Read the generated files. |

### Sharing
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/runs/:run/export` | Download the run as `.zip`. |
| POST | `/api/import` | Upload a `.zip`. Returns the imported run. |

## Event stream

`GET /api/events` is a Server-Sent Events stream with the runner events from
[run-execution.md](run-execution.md#events). Each event has an `id`. A client that reconnects
with `Last-Event-ID` gets the events it missed, from a buffer of the last 1,000 events. If the
gap is larger, the server sends `resync`, and the client reloads its data.
