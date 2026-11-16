# Conclusion — local classifier evaluation, 2026-11-14

**Scope:** nine local Ollama models asked to label 24 prompts with a request kind and a difficulty
level, 3 repeats each (72 calls per model), temperature 0, JSON output required, run at four context
sizes: `num_ctx` 2048, 4096, 8192 and 16384.
**Sources:** `classifications-2026-11-14T14-47-25-634Z.json` (2048),
`classifications-2026-11-14T12-08-57-478Z.json` (4096),
`classifications-2026-11-14T12-45-12-377Z.json` (8192) and
`classifications-2026-11-14T13-32-28-209Z.json` (16384), 9 models each.
**Method:** `how-we-test.md` in this folder.

## 1. Headline

No model is good enough to be the router's only classifier. The best model, `qwen3.5:4b`, agrees
with the hand labels on 88% of calls and is perfectly consistent, but it costs 2.4 s per call. The
models fast enough to classify on the request path (`granite3.3:2b` at 1.4 s, `llama3.2:3b` at
1.5 s) agree on only 57–65%. The gap between "accurate" and "fast enough" is the central result.

## 2. Results at num_ctx 4096

| Model | Valid JSON | Kind | Diff exact | Diff ±1 | Consistency | Median ms | P95 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| `qwen3.5:4b` | 100% | 88% | 79% | 100% | 100% | 2,416 | 3,586 |
| `gemma3:4b` | 96% | 75% | 83% | 96% | 96% | 2,166 | 2,970 |
| `qwen3:4b` | 83% | 71% | 74% | 83% | 79% | 2,552 | 7,531 |
| `qwen2.5-coder:3b` | 83% | 67% | 58% | 83% | 79% | 1,692 | 4,523 |
| `llama3.2:3b` | 79% | 65% | 67% | 79% | 75% | 1,453 | 5,637 |
| `phi4-mini` | 100% | 63% | 79% | 100% | 100% | 2,220 | 2,507 |
| `granite3.3:2b` | 67% | 57% | 50% | 67% | 63% | 1,406 | 1,977 |
| `qwen3.5:2b` | 29% | 21% | 21% | 29% | 29% | 857 | 2,402 |
| `mistral:7b` | 67% | 50% | 58% | 67% | 67% | 6,289 | 17,602 |

## 3. Context size: latency moves, accuracy does not

Each model was run at 2048, 4096, 8192 and 16384. Kind accuracy is identical at every size for
seven of the nine models; `qwen3:4b` gains 5 points and `phi4-mini` loses 5 between 2048 and 16384.
Valid JSON moves by at most 4 points. Median latency, by contrast, rises steeply for the larger
models.

| Model | Kind acc 2048 / 4096 / 8192 / 16384 | Median ms 2048 / 4096 / 8192 / 16384 |
|---|---|---|
| `qwen3.5:4b` | 88 / 88 / 88 / 88 | 4,640 / 2,416 / 4,158 / 9,750 |
| `qwen3:4b` | 68 / 71 / 72 / 76 | 2,391 / 2,552 / 2,819 / 5,558 |
| `gemma3:4b` | 75 / 75 / 75 / 75 | 2,293 / 2,166 / 2,653 / 4,235 |
| `phi4-mini` | 63 / 63 / 56 / 58 | 2,253 / 2,220 / 2,683 / 5,312 |
| `llama3.2:3b` | 65 / 65 / 65 / 65 | 1,433 / 1,453 / 1,507 / 2,803 |
| `qwen2.5-coder:3b` | 67 / 67 / 67 / 67 | 1,823 / 1,692 / 1,819 / 2,144 |
| `granite3.3:2b` | 57 / 57 / 57 / 57 | 1,415 / 1,406 / 1,410 / 1,577 |
| `mistral:7b` | 50 / 50 / 54 / 54 | 6,188 / 6,289 / 9,750 / 11,654 |
| `qwen3.5:2b` | 21 / 21 / 21 / 21 | 1,819 / 857 / 1,843 / 2,276 |

**The cost of context is not uniform.** `granite3.3:2b` moves 1,406 → 1,577 ms across a 4× context
increase, about 12%. `qwen3.5:4b` moves 2,416 → 9,750 ms, about 300%. The larger the model, the more
the KV cache pushes it off the 4 GB card: `ollama ps` showed 55–64% of the work on CPU at 16384 for
the 4B and 7B models, against 100% GPU at 4096 for the small ones.

**The 2048 numbers are not a clean baseline.** `qwen3.5:4b` is slower at 2048 (4,640 ms) than at
4096 (2,416 ms), and `qwen3.5:2b` likewise (1,819 vs 857 ms). A smaller context cannot cost more
work, so those two figures reflect machine state during that campaign, not context size. Treat 2048
latency as indicative only; its accuracy figures are consistent with the rest.

## 4. What the numbers say

**JSON discipline and label accuracy are separate skills.** `phi4-mini` returns valid JSON on every
call and repeats itself perfectly, yet picks the right kind only 63% of the time. `qwen3.5:2b` fails
both. A model that always answers in the right shape can still be the wrong classifier, so JSON
validity cannot stand in for accuracy in a selection rule.

**Kind is harder than difficulty.** For every model except `llama3.2:3b`, kind accuracy is at or
below difficulty-exact accuracy, and the ±1 column is far higher than the exact column. Models
broadly sense how hard a request is while mislabelling what kind of request it is. If the router
only needs a complexity signal, the cheaper models are more usable than the kind column suggests.

**Consistency tracks validity, not accuracy.** `phi4-mini` and `qwen3.5:4b` are 100% consistent;
`granite3.3:2b` is 63%. A model that answers the same way every time is predictable to operate, but
predictably wrong is still wrong.

**Latency spread is large and uneven.** Medians run from 857 ms to 6,289 ms, but p95 reaches 17.6 s
for `mistral:7b`, 7.5 s for `qwen3:4b` and 5.6 s for `llama3.2:3b`. On a 4 GB GTX 1050 the tail is
where a classifier would stall a request, so p95 matters more than the median for this use.
`mistral:7b` is the worst combination in the set: slowest at every percentile and only 50% kind
accuracy.

## 5. Recommendation

1. **Use `qwen3.5:4b` if classification quality dominates** and a 2.4 s median is acceptable, for
   example as an offline or batched labeller rather than an inline gate.
2. **Use `gemma3:4b` as the balanced choice**: 75% kind accuracy, 96% consistency, 2.2 s median and
   the best difficulty-exact score of the fast group.
3. **Do not use `qwen3.5:2b`** at 4096 context. Its 29% valid JSON makes it unusable, and the cause
   of its collapse from 96% on 2026-11-11 is still unexplained.
4. **Do not use `granite3.3:2b`** as a sole classifier: 57% kind accuracy is close to a coin toss
   across six kinds.
5. **Do not use `mistral:7b`** at all for this task: 50% kind accuracy with a 6.3 s median and a
   17.6 s p95.
6. **Keep a rule-based fallback.** With the best model at 88%, roughly one call in eight is
   mislabelled. The router should treat the classifier's output as a signal with a confidence
   threshold, not as a fact.

## 6. Limits of this conclusion

- 24 prompts, 3–6 per kind. Differences of a few points are inside the noise; the ordering of the
  top four is indicative, not settled.
- Labels are self-assigned, so accuracy means agreement with this prompt set, not ground truth.
- `mistral:7b` is included; it finished after the first draft of this conclusion.
- All four context sizes are covered, but the 2048 latency figures are contaminated by machine state
  and should not be read as a context effect.
- Latency was measured on one machine with other work running, so treat it as indicative rather than
  reproducible.
- The JSON keeps no raw model output, so no wrong label can be inspected after the fact.
- Latency was measured while other work ran on the same machine, so treat it as indicative.

## 7. Measured optimisation levers

Single-model latency levers for `qwen3.5:4b` are measured in
[`optimisation-levers-2026-11-14.md`](optimisation-levers-2026-11-14.md): context size
(2048 → 16384: median +63.0%, p95 +73.2%, VRAM +549 MB), output cap 60 → 16 (−6.5% median),
GPU temperature (hot 2.07–2.26× slower), and flash attention with KV cache q8_0 (+22.7% median,
+11.9% p95, −61.9 MB VRAM over three paired legs). None of them changes classification accuracy.
