# Roadmap

Milestones in order. Each one ends with a usable state and a release.

## M0 — Foundation (`0.1.0`)
**Deliverables**
- npm workspace with the layout in [technology.md](technology.md). Empty packages build.
- TypeScript, ESLint, Prettier and Vitest set up. Dependency rules enforced.
- GitHub Actions pipeline from [quality.md](quality.md), with the licence check.
- `NOTICE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, templates.
- The original study moved to `legacy/classifier-evaluation/`. Its scripts still run.

**Done when** CI is green on an empty project and the legacy scripts produce the same output as
before the move.

## M1 — Core, store and migration (`0.2.0`)
**Deliverables**
- `packages/core`: schemas, classification parsing and scoring, metrics, Wilson intervals,
  coverage, fingerprint, comparability, re-score eligibility.
- `packages/store`: file store, locking, atomic writes.
- Migration of the original results into `studies/classifier-evaluation/`.
- `modelbench migrate`, `studies`, `runs`, `show`, `compare`.

**Done when** the golden test passes for all four original result files.

## M2 — Running from the command line (`0.3.0`)
**Deliverables**
- `packages/providers` with the Ollama adapter.
- `packages/profiler` with disturbance detection.
- `packages/runner`: planning, queue, execution, pause, resume, cancel, failure, re-score.
- `packages/testing` stub provider.
- `modelbench plan`, `run`, `resume`, `rescore`, `flag`, `models`, `export`, `import`, `delete`.

**Done when** a campaign of the classifier study at two context sizes runs end to end from the
command line on real Ollama, survives a `Ctrl+C` and resume, and every call keeps its raw answer.

## M3 — GUI: browse and compare (`0.4.0`)
**Deliverables**
- `apps/server`: read endpoints, comparison, event stream.
- `apps/web`: home, study, campaign, run, calls and compare pages, with charts and table views.
- `modelbench serve`.

**Done when** the migrated campaigns can be explored in the GUI down to single calls, and the
comparison shows warnings for runs from different dataset versions.

## M4 — GUI: run campaigns (`0.5.0`)
**Deliverables**
- Plan campaign page, live run page, pause, resume, cancel, disturbance flag editing.
- Write endpoints for campaigns and runs.

**Done when** a campaign planned in the GUI runs with live progress, and the GUI recovers after
a server restart in the middle of a run.

## M5 — Datasets and labelling (`0.6.0`)
**Deliverables**
- Dataset editor, import, coverage page, disagreements page, freeze.
- Several labellers and the agreement figure.
- Re-score from the GUI.

**Study work in parallel:** expand the classifier dataset to 150 cases, at least 20 per kind,
balanced across difficulty, with real-traffic and ambiguous cases, and a second labeller.

**Done when** the expanded dataset is frozen with every coverage target met, and the earlier
runs are re-scored against it with excluded cases listed.

## M6 — Reports and 1.0 (`1.0.0`)
**Deliverables**
- `packages/report`, report generation from GUI and command line, conclusions stored with
  campaigns.
- Data format frozen at `formatVersion: 1`.
- `legacy/` removed.
- npm package published.

**Done when** a new user can install from npm, run the classifier study on their own Ollama, and
export results for a pull request, following only the README and `CONTRIBUTING.md`.

## M7 — Second provider (`1.1.0`)
**Deliverables**
- OpenAI-compatible adapter.
- Provider settings page that can be edited.

**Done when** the classifier study runs against llama.cpp server and LM Studio.

## Later
- Task types `extraction` and `free-text`.
- Machine profiling for AMD and Apple graphics.
- A public gallery of shared results.

## Migration

`modelbench migrate legacy/classifier-evaluation` does the following:

1. Creates the study `classifier-evaluation`, version 1, from `classifier-evaluation-settings.json`.
2. Creates dataset version 1 from `classifier-evaluation-prompts.json`. The existing labels
   become reference labels, with primary labeller `maintainer`.
3. Creates one campaign, `2026-11-14-context-sizes`. All four original files used the same study
   and dataset, and differ only in context size, which a campaign may vary.
4. Creates one run per model per original file (36 runs), with origin `migrated` and
   `missing: ["raw", "firstTokenMs", "tokens", "machine"]`.
5. Writes `calls.jsonl` from the stored results. `raw` is `null`. The state is set from the
   original fields: `valid: true` → `valid`, `bad-json` → `bad-format`, `bad-values` →
   `bad-values`, any other error → `error`.
6. Writes `scores-1.json` and checks the result with the golden test.
7. Copies `conclusion-2026-11-14.md` into the campaign's conclusion.

The original conclusion says the 2048 context size latency is affected by machine state. Those
nine runs are migrated with the disturbance flag set, as a flag set by the user, with that
sentence as the note.
