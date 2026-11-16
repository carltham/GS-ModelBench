# Scoring and metrics

## Scoring per task type

Scoring is the only part that differs between task types. Each task type defines how an answer is
parsed and how each field is scored.

| Task type | Answer | Field scoring |
|---|---|---|
| Classification | One value per field from a fixed list | Exact match. For ordered fields such as difficulty: also within the field's tolerance N, set in the task definition. |
| Extraction | Fields with free values | Exact match, or a match after normalising case, spacing and formatting. |
| Free text | Text | Defined by the study, for example contains required facts, or judged against a reference. |

The first version needs only **classification**. The others show where the design must leave
room.

## Answer validity

Each call ends up in exactly one of these states:

| State | Meaning |
|---|---|
| `valid` | Parsed and every field holds an allowed value. |
| `bad-format` | The answer could not be parsed. |
| `bad-values` | Parsed, but a field is missing or holds a value that isn't allowed. |
| `error` | No usable answer: timeout or server error. |

A call that isn't `valid` counts as wrong in every accuracy metric. A model can't raise its
accuracy by failing to answer.

## Run metrics

Metrics belong to a scoring version (see [domain-model.md](domain-model.md#scoring-version)).
Models are always scored against each case's reference label.

| Metric | Definition |
|---|---|
| Valid answers | Share of calls in state `valid`. |
| Accuracy per field | Share of all calls where the field matches the reference label. |
| Within-N accuracy | For ordered fields: share of calls within the field's tolerance N of the reference label. |
| Consistency | Share of cases where every repeat gave the same valid answer. |
| Errors | Count of calls in state `error`, kept apart from format failures. |
| Latency | Median and 95th percentile over all calls except the warm-up. |
| Time to first token, output rate | When the model server reports them. |

Every metric is also available per label value, per difficulty, per tag and per labeller.

## Uncertainty

- Each accuracy metric shows a 95% range, based on the number of **distinct cases**. With
  near-deterministic settings, repeats of the same case are not independent, so the number of
  calls overstates the sample size.
- When two runs' ranges overlap, the comparison says that the difference may be noise.
- The dataset coverage check uses the same calculation to show, before a run, how precise the
  results can be.

## Agreement ceiling

When cases have labels from several labellers, the system reports how often the labellers agree.
The extra labels are used only for this figure, never for scoring.
Model accuracy is shown next to that figure. A model can't meaningfully beat the labellers'
agreement with each other.
