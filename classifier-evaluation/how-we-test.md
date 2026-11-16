# How we test — local classifier evaluation

Ruleset for measuring how reliably a local Ollama model classifies a router request into a
request kind and a difficulty level. It covers the classifier evaluation in this folder only.
Application tests (Vitest, Playwright) are separate and are described in `AGENTS.md`.

## 1. What is measured

Each model is asked to label a prompt with exactly one `kind` and one `difficulty`, and nothing
else. Six metrics are computed per model per run:

| Metric | Meaning |
|---|---|
| `validJsonPct` | Share of calls whose reply parsed as JSON with an allowed kind and difficulty. |
| `kindAccuracyPct` | Share of calls whose kind matched the hand label. |
| `difficultyExactPct` | Share of calls whose difficulty matched the hand label exactly. |
| `difficultyWithinOnePct` | Share of calls within one difficulty level of the hand label. |
| `consistentPct` | Share of prompts where all repeats of a prompt produced the same kind and difficulty. |
| `medianMs`, `p95Ms` | Latency percentiles over all calls, excluding the warm-up call. |

A call that fails to parse is counted as wrong in every accuracy metric, so a model cannot gain
accuracy by refusing to answer.

## 2. Fixed inputs

- **Prompts:** `classifier-evaluation-prompts.json`, 24 hand-labelled cases. Fields: `id`, `kind`,
  `difficulty`, `prompt`. The set is not balanced: chat 4, code 6, reasoning 5, translation 3,
  summarisation 3, extraction 3; simple 9, moderate 8, complex 7. Per-kind accuracy therefore rests
  on 3 to 6 prompts, which is enough to rank models but not to separate close ones.
- **Kinds:** `chat`, `translation`, `summarisation`, `extraction`, `code`, `reasoning`.
- **Difficulty levels:** `simple`, `moderate`, `complex`.
- **Models:** the nine entries in `classifier-evaluation-settings.json`. All nine are run in every
  campaign, including models already pulled.
- **Generation:** `temperature: 0`, `num_predict: 60`, `think: false`, `format: "json"`,
  `num_ctx` set per campaign.
- **Repeats:** 3 per prompt, so 72 calls per model per campaign.
- **Host:** `http://localhost:11434`, timeout 120 s per call.

Changing a prompt, a label, a kind, a difficulty level or a generation setting starts a new
campaign. Do not compare results across a change to the prompt set or the labels.

## 3. Context-size campaigns

The current series varies only `num_ctx`: **4096, 8192, 16384**. Everything else stays fixed, so a
difference between campaigns is attributable to context size.

- Pass the size on the command line: `--num-ctx 8192`.
- The value is sent to Ollama as `num_ctx` and written into every JSON as `numCtx`.
- A JSON without `numCtx` predates this rule and must not be compared with a campaign run.
- Run the campaigns in ascending order and finish one before starting the next, so the machine
  carries only one model at a time.

## 4. Run procedure

1. Confirm the models are installed: `ollama list` must show all nine.
2. Confirm nothing else is loaded: `ollama ps` should be empty before a campaign starts.
3. Start the campaign in the background and log it:
   `node classifier-evaluation/run-classifier-evaluation.mjs --num-ctx <size> 2>&1 | tee /tmp/ctx-<size>.log`
4. The runner performs one warm-up call per model, excluded from the metrics, so latency does not
   include model load.
5. The runner rewrites its JSON after every model, so partial results are readable during a run.
6. After each model finishes, rebuild the report and charts:
   `node classifier-evaluation/build-classifier-summary.mjs`.
7. Report progress while the campaign runs, naming the models finished and the model in flight.

## 5. Outputs and naming

- Results folder: `classifier-evaluation-results/`. The name is fixed.
- One JSON per campaign: `classifications-<tested>.json`, where `tested` is the UTC start time with
  `:` and `.` replaced by `-`. The top-level `tested` field equals the filename suffix.
- One run report per date: `classifications-<YYYY-MM-DD>.md`. Its date, filename and contents must
  agree with the `tested` date of the runs it describes. Never put one date's results in another
  date's report.
- Every run report has a `Source:` line naming each JSON it was built from.
- Charts and the cross-run summary are generated: `summary-0-per-run.svg`, `metric-*.svg`,
  `summary-3-per-kind.svg` and `summary-report-<date>.md`. Do not hand-edit them; change the
  builder in `summary/` and regenerate.
- JSON files are git-ignored; Markdown and SVG reports are tracked.

## 6. Reporting rules

- Report only what a file or tool output shows. If a number is not in a JSON or a log line, it is
  not a result.
- State plainly which models were not run, and why.
- Mark a figure preliminary while the run that produces its JSON is still in flight.
- Keep the run report, the summary report and the charts consistent with the JSON after every
  model. A model that has finished must appear in all three.
- Do not create extra verification runs inside the results folder. Verify runner changes in a
  temporary directory outside the repository and delete it afterwards.
- Do not delete results, reports or charts without explicit confirmation.

## 7. Interpreting results

- Compare models within one campaign first; compare campaigns only for the same model and the same
  prompt set.
- A high `validJsonPct` with a low `kindAccuracyPct` means the model answers in the right shape but
  picks the wrong label. Check `bad-values` counts before blaming the model's JSON ability.
- A large gap between `medianMs` and `p95Ms` means a few calls stalled; report both, never the
  median alone.
- Latency is only comparable within one context size and one machine state. A campaign that ran
  while another download or evaluation was active is not comparable on latency.
- The labels are self-assigned, so accuracy is agreement with this prompt set, not ground truth.
  Twenty-four prompts cannot separate models that differ by a few points.

## 8. Known limits

- The JSON keeps no raw model output, so a wrong label cannot be inspected after the run.
- `qwen3.5:2b` scored 96% valid JSON on 2026-11-11 and 29% on 2026-11-14 at the same 4096 context.
  The cause is still unknown; treat its numbers as unstable until explained.
- The machine is a GTX 1050 with 4 GB VRAM. Larger context sizes push models onto the CPU, so
  latency across campaigns reflects memory pressure as well as the model.
