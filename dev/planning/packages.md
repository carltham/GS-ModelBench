# Packages

Each package's responsibility and public interface. Signatures are TypeScript and show the
shape. The final code may add fields, but must not change what these do.

## `packages/core`

Domain schemas and pure functions. No I/O.

**Schemas** (Zod, with inferred types): `Study`, `TaskDefinition`, `OutputField`, `DatasetVersion`,
`Case`, `Label`, `RunSettings`, `MachineProfile`, `Campaign`, `Run`, `RunStatus`, `RunOrigin`,
`Call`, `CallState`, `ScoringVersion`, `Score`, `RunMetrics`, `Interval`.

```ts
type CallState = "valid" | "bad-format" | "bad-values" | "error";
type RunStatus = "planned" | "running" | "paused" | "completed" | "cancelled" | "failed";
type RunOrigin =
  | { kind: "local"; startedBy: string }
  | { kind: "imported"; source: string; importedAt: string }
  | { kind: "migrated"; source: string; missing: string[] };

interface OutputField {
  name: string;               // "kind"
  values: string[];           // allowed values
  ordered: boolean;           // true for "difficulty"
  tolerance?: number;         // N for within-N accuracy, ordered fields only
}

interface TaskDefinition {
  taskType: "classification"; // "extraction" and "free-text" later
  instruction: string;
  fields: OutputField[];
}
```

**Functions**

| Function | Purpose |
|---|---|
| `buildPrompt(task, case)` | The exact system and user messages sent for a case. |
| `parseAnswer(task, raw)` | Raw text → `{ state, answer? , reason? }`. Accepts JSON wrapped in a Markdown code fence. |
| `scoreCall(task, call, referenceLabel)` | One `Score`: per field `exact` and, for ordered fields, `withinTolerance`. |
| `computeMetrics(task, calls, scores, cases)` | `RunMetrics`, overall and per label value, difficulty and tag. |
| `wilson(successes, n)` | 95% Wilson score interval. |
| `coverage(dataset, targets)` | Case counts per group, groups below target, expected interval width. |
| `labellerAgreement(dataset)` | Agreement rate between labellers, per field. |
| `fingerprint(dataset)` | SHA-256 of the canonical case list, via Web Crypto. |
| `comparability(runA, runB)` | List of differences that make two runs not like-for-like. |
| `rescoreEligibility(oldDataset, newDataset)` | Cases kept and cases excluded when re-scoring. |

**Uncertainty:** an accuracy of `p` over a run is given the Wilson interval with `n` = number of
distinct cases, as [`scoring-and-metrics.md`](../architecture/scoring-and-metrics.md) requires.
Successes are `p × n`, rounded.

## `packages/providers`

The only code that talks to model servers.

```ts
interface ModelProvider {
  readonly id: string;                              // from configuration
  listModels(): Promise<ModelInfo[]>;
  describeModel(name: string): Promise<ModelVariant>; // digest, parameters, quantisation, context max
  chat(request: ChatRequest, signal: AbortSignal): Promise<ChatResult>;
  warmUp(model: string, settings: RunSettings): Promise<void>;
  unload(model: string): Promise<void>;
  placement(model: string): Promise<Placement | null>; // share on graphics card, memory used
  version(): Promise<string | null>;
}

interface ChatResult {
  raw: string;
  totalMs: number;
  firstTokenMs: number | null;
  promptTokens: number | null;
  outputTokens: number | null;
  error?: { kind: "timeout" | "http" | "network"; message: string };
}
```

- **Ollama adapter:** `/api/tags`, `/api/show`, `/api/chat` with `stream: true` (to measure time
  to first token), `/api/ps`, `/api/version`. Unload with `keep_alive: 0`.
- **OpenAI-compatible adapter:** `/v1/models` and `/v1/chat/completions` with streaming and
  `response_format: { type: "json_object" }`. `placement` and `version` return `null`.
- Timing is measured in the adapter with `performance.now()`, from sending the request to the
  last streamed chunk.
- `chat` never throws for timeouts or server errors. They come back in `error`.

## `packages/profiler`

```ts
interface Profiler {
  snapshot(provider: ModelProvider, model: string): Promise<MachineSnapshot>;
  sampleLoad(): Promise<LoadSample>;  // processor load, graphics card use and temperature
  detectDisturbance(samples: LoadSample[], start: MachineSnapshot): Disturbance | null;
}
```

- Processor, memory and operating system: Node.js `os`.
- Graphics card: `nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu,temperature.gpu --format=csv,noheader,nounits`.
  If it is missing or fails, graphics card fields are `null`.
- Model placement: `provider.placement(model)`.
- Disturbance thresholds are in [configuration.md](configuration.md).

## `packages/store`

```ts
interface ResultStore {
  listStudies(): Promise<StudySummary[]>;
  getStudy(id: string): Promise<Study>;
  saveStudy(study: Study): Promise<Study>;                 // new study version if the task changed
  listDatasetVersions(studyId: string): Promise<DatasetVersionSummary[]>;
  getDataset(studyId: string, version: number): Promise<DatasetVersion>;
  getDraft(studyId: string): Promise<DatasetDraft>;
  saveDraft(studyId: string, draft: DatasetDraft): Promise<void>;
  freezeDraft(studyId: string): Promise<DatasetVersion>;
  createCampaign(c: NewCampaign): Promise<Campaign>;
  getCampaign(id: CampaignRef): Promise<Campaign>;
  createRun(r: NewRun): Promise<Run>;
  updateRun(r: Run): Promise<void>;
  appendCall(run: RunRef, call: Call): Promise<void>;
  readCalls(run: RunRef): AsyncIterable<Call>;
  saveScoringVersion(run: RunRef, s: ScoringVersion): Promise<void>;
  deleteRun(run: RunRef, confirmation: string): Promise<void>; // confirmation must equal the run id
  exportRun(run: RunRef): Promise<Buffer>;                   // a .zip file
  importRun(archive: Buffer): Promise<Run>;                  // origin becomes "imported"
}
```

- `FileStore` is the only implementation. The format is in [data-format.md](data-format.md).
- `migrateLegacy(path)` converts the original `classifications-*.json` files. See
  [roadmap.md](roadmap.md#migration).

## `packages/runner`

```ts
interface Runner {
  plan(request: CampaignRequest): Promise<CampaignPlan>;   // runs, calls, estimated duration
  enqueue(plan: CampaignPlan): Promise<Campaign>;
  pause(run: RunRef): void;
  resume(run: RunRef): void;
  cancel(run: RunRef): void;
  rescore(run: RunRef, datasetVersion: number): Promise<ScoringVersion>;
  readonly events: EventEmitter<RunnerEvents>;              // see run-execution.md
}
```

Details in [run-execution.md](run-execution.md).

## `packages/report`

| Function | Output |
|---|---|
| `campaignReport(campaign, runs)` | Markdown: settings, metrics table with intervals, breakdowns, chart links, conclusion. |
| `charts(campaign, runs)` | SVG files: metrics per model, accuracy against latency, confusion matrices. |

Reports are written to `campaigns/<campaign>/report/`. Each report names its source runs, their
scoring versions and the run dates.

## `packages/testing`

- `startStubProvider(script)`: an HTTP server that speaks the Ollama API and the OpenAI-compatible
  API. It answers from a script of answers and delays, so tests are deterministic.
- Fixture studies, datasets and runs.
