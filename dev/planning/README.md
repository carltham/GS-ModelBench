# GS-ModelBench — technical planning

How GS-ModelBench is built. What it does is described in [`../architecture/`](../architecture/).
Every choice here is decided. To change one, update the document in the same pull request as the
code that changes it.

## Documents

| Document | Content |
|---|---|
| [technology.md](technology.md) | Technology stack and repository layout. |
| [packages.md](packages.md) | Each package: responsibility, public interface, dependencies. |
| [data-format.md](data-format.md) | Files on disk: folders, file formats, ids, versions, locking. |
| [run-execution.md](run-execution.md) | How runs are queued, executed, paused, resumed, profiled and scored. |
| [server-api.md](server-api.md) | HTTP API and the live event stream. |
| [gui.md](gui.md) | Angular application: routes, pages, state, charts. |
| [cli.md](cli.md) | Command line: commands and options. |
| [configuration.md](configuration.md) | Settings, defaults and environment variables. |
| [quality.md](quality.md) | Code standards, tests and continuous integration. |
| [open-source.md](open-source.md) | Licence, community files, contributions, versioning and releases. |
| [roadmap.md](roadmap.md) | Milestones, deliverables, acceptance criteria and migration. |

## Mapping from architecture to code

| Architecture component | Package or app |
|---|---|
| Study catalogue | `packages/store`, `apps/server`, `apps/web` |
| Dataset management | `packages/core` (coverage, fingerprint), `packages/store`, `apps/web` |
| Model provider gateway | `packages/providers` |
| Machine profiler | `packages/profiler` |
| Run orchestration | `packages/runner` |
| Scoring | `packages/core` |
| Result store | `packages/store` |
| Analysis and comparison | `packages/core` (metrics, comparability), `apps/web` |
| Reporting | `packages/report` |
| Interfaces | `apps/web`, `apps/server`, `apps/cli` |
