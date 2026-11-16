# Data format

All data lives under one data root. The default is `studies/` in the repository (see
[configuration.md](configuration.md)). Every file is UTF-8 and validated against its Zod schema
from `packages/core`, both when read and when written.

Every JSON file has a top-level `"formatVersion"`, and every line in `calls.jsonl` has `"fv"`.
They are left out of the examples below. See [open-source.md](open-source.md#versioning).

## Folder layout

```text
<data root>/
  .lock                                    held by the process that writes
  <study-id>/
    study.json                             study versions and settings
    dataset/
      draft.json                           cases being edited, not yet frozen
      v1.json, v2.json, ...                frozen dataset versions, never changed
    campaigns/
      <campaign-id>/
        campaign.json                      study version, dataset version, conclusion
        report/                            generated Markdown and SVG
        runs/
          <run-id>/
            run.json                       settings, model, machine profile, status, origin
            calls.jsonl                    one call per line, append only
            scores-1.json, scores-2.json   scoring versions, never changed
```

## Ids

| Thing | Format | Example |
|---|---|---|
| Study | lowercase slug, chosen at creation | `classifier-evaluation` |
| Study version | integer from 1 | `3` |
| Dataset version | integer from 1 | `2` |
| Case | slug, unique in the study, never reused | `trans-3` |
| Campaign | `<yyyy-mm-dd>-<slug>` | `2026-11-20-context-sizes` |
| Run | `<model-slug>-<yyyymmddThhmmssZ>-<4 hex>` | `qwen3.5-4b-20261120T101500Z-a3f9` |
| Scoring version | integer from 1, per run | `2` |
| Call | sequence number from 1, per run | `57` |

## Files

### `study.json`
```json
{
  "id": "classifier-evaluation",
  "name": "Classify a chat request by kind and difficulty",
  "versions": [
    {
      "version": 1,
      "createdAt": "2026-11-20T09:00:00Z",
      "task": {
        "taskType": "classification",
        "instruction": "Classify the user's request. Reply with JSON only, ...",
        "fields": [
          { "name": "kind", "values": ["chat", "translation", "summarisation", "extraction", "code", "reasoning"], "ordered": false },
          { "name": "difficulty", "values": ["simple", "moderate", "complex"], "ordered": true, "tolerance": 1 }
        ]
      }
    }
  ],
  "defaults": { "settings": { "temperature": 0, "maxOutputTokens": 60, "contextSize": 4096, "reasoning": false, "structuredOutput": true, "repeats": 3, "timeoutMs": 120000, "warmUp": true } },
  "modelsOfInterest": [{ "provider": "local-ollama", "model": "qwen3.5:4b" }],
  "coverageTargets": { "perValue": { "kind": 20 }, "perValueAndField": { "kind×difficulty": 6 } }
}
```
Changing `task` adds a version. Changing `defaults`, `modelsOfInterest` or `coverageTargets`
doesn't.

### `dataset/v<N>.json`
```json
{
  "version": 2,
  "frozenAt": "2026-11-21T14:00:00Z",
  "studyVersion": 1,
  "fingerprint": "sha256:9c1e...",
  "primaryLabeller": "maintainer",
  "cases": [
    {
      "id": "trans-3",
      "input": "Translate this legal clause into German ...",
      "tags": ["synthetic"],
      "source": "hand",
      "labels": [
        { "labeller": "maintainer", "values": { "kind": "translation", "difficulty": "complex" } },
        { "labeller": "second", "values": { "kind": "translation", "difficulty": "moderate" } }
      ],
      "reference": { "kind": "translation", "difficulty": "complex" }
    }
  ]
}
```
- `reference` is the primary labeller's label, or the label the user confirmed when labellers
  disagreed.
- The fingerprint covers `id`, `input` and `reference` of every case, sorted by `id`, serialised
  as canonical JSON. Tags and extra labels don't change it.

### `campaign.json`
```json
{
  "id": "2026-11-20-context-sizes",
  "studyId": "classifier-evaluation",
  "studyVersion": 1,
  "datasetVersion": 2,
  "createdAt": "2026-11-20T10:00:00Z",
  "description": "Nine models at four context sizes",
  "runIds": ["qwen3.5-4b-20261120T101500Z-a3f9"],
  "conclusion": { "text": "…Markdown…", "writtenAt": "2026-11-21T08:00:00Z" }
}
```

### `run.json`
```json
{
  "id": "qwen3.5-4b-20261120T101500Z-a3f9",
  "campaignId": "2026-11-20-context-sizes",
  "provider": "local-ollama",
  "model": { "name": "qwen3.5:4b", "digest": "sha256:…", "parameters": "4B", "quantisation": "Q4_K_M" },
  "settings": { "temperature": 0, "maxOutputTokens": 60, "contextSize": 4096, "reasoning": false, "structuredOutput": true, "repeats": 3, "timeoutMs": 120000, "warmUp": true },
  "status": "completed",
  "statusHistory": [{ "status": "running", "at": "2026-11-20T10:15:00Z" }],
  "origin": { "kind": "local", "startedBy": "maintainer" },
  "machine": { "start": { }, "end": { }, "samples": [ ] },
  "disturbance": { "flagged": false, "by": null, "note": null },
  "progress": { "callsDone": 72, "callsTotal": 72 },
  "displayScoringVersion": 1
}
```
`run.json` is the only run file that changes after creation. It is rewritten atomically: write
to `run.json.tmp`, then rename.

### `calls.jsonl`
One JSON object per line, in the order the calls were made:
```json
{"seq":1,"caseId":"chat-1","repeat":1,"sentAt":"2026-11-20T10:15:04.120Z","messages":[{"role":"system","content":"…"},{"role":"user","content":"Hi! How are you today?"}],"raw":"{\"kind\":\"chat\",\"difficulty\":\"simple\"}","state":"valid","answer":{"kind":"chat","difficulty":"simple"},"totalMs":1228.6,"firstTokenMs":1101.2,"promptTokens":112,"outputTokens":14,"error":null}
```
Lines are only appended, each followed by `fsync`. On reading, a last line that is cut off by a
crash is ignored and logged.

### `scores-<N>.json`
```json
{
  "version": 2,
  "createdAt": "2026-11-22T09:00:00Z",
  "datasetVersion": 3,
  "excludedCases": [{ "caseId": "sum-2", "reason": "input-changed" }],
  "scores": [{ "seq": 1, "fields": { "kind": { "exact": true }, "difficulty": { "exact": true, "withinTolerance": true } } }],
  "metrics": { }
}
```

## Locking

- The process that writes takes `<data root>/.lock`, containing its process id and start time.
- The server holds the lock while it runs. The CLI takes it for commands that write, and refuses
  with a clear message if the server holds it. Read-only CLI commands don't need it.
- A lock whose process no longer exists is taken over, with a warning.

## Export and import

- An export is a `.zip` with `run.json`, `calls.jsonl`, all `scores-*.json`, the
  `campaign.json` it belongs to and the dataset version it used.
- Import creates the study, dataset version and campaign if they don't exist. If a dataset
  version with the same number but a different fingerprint exists, the imported dataset is stored
  as the next free version, and the import says so.
- Imported runs get origin `imported`, with the file name and import date.
