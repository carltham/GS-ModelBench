# What is this good for?

GS-ModelBench helps you answer one practical question: **which local model should I use for this
job, on my own machine?**

Public leaderboards rank models on general benchmarks, run on datacenter hardware. That rarely
tells you how a small model behaves on your task, on your GPU, under your settings.
GS-ModelBench tests models on a narrow, concrete task with labelled examples. It measures quality
and speed together on the hardware you actually have.

## Who it is for

- **Developers building on local LLMs** who need to pick a model for one job, such as
  classification, routing, extraction or labelling, and want evidence rather than a guess.
- **Self-hosters running Ollama** on consumer hardware who want to know what their GPU can
  realistically handle.
- **Anyone tuning a local setup** who wants to see what a setting such as context size, output
  cap or KV cache type really costs.

## What it tells you

For each model in a study, GS-ModelBench reports:

| Question | Measured as |
|---|---|
| Does it follow the output format? | Share of calls that return valid JSON with allowed values |
| Is it right? | Agreement with hand-labelled expected answers |
| Is it predictable? | Whether repeated calls at temperature 0 give the same answer |
| Is it fast enough? | Median and p95 latency, measured on your machine |
| What do settings cost? | The same study rerun at different context sizes or options |

These are separate skills. A model can return perfect JSON every time and still pick the wrong
label. Reporting them side by side keeps a tidy-looking model from passing as an accurate one.

## An example of what you learn

The first study, [`classifier-evaluation/`](classifier-evaluation/), asked nine local models to
label chat requests with a request kind and a difficulty level, on a 4 GB GTX 1050. It found
that:

- The most accurate model (`qwen3.5:4b`, 88%) was too slow to sit on a request path (2.4 s median).
- The fast models (about 1.4 s) agreed with the labels only 57–65% of the time.
- A larger context window barely changed accuracy but could multiply latency several times
  once the model no longer fitted on the GPU.
- The slowest model was also among the least accurate.

None of that is visible on a general leaderboard. It decides which model you ship, or whether
you need a rule-based fallback. Full results are in the
[conclusion](classifier-evaluation/classifier-evaluation-results/conclusion-2026-11-14.md).

## What it is not

- **Not a general leaderboard.** Results are only as broad as the study's prompt set. They tell
  you how a model does on that task, not how smart it is in general.
- **Not ground truth.** Accuracy means agreement with the study's labels, which are written by
  hand.
- **Not a lab-grade latency test.** Timings come from real consumer machines and are
  indicative. Rerun them on your own hardware.

## Where it is going

Today each study is a set of plain Node.js scripts with no dependencies. They run against any
local Ollama server and write timestamped JSON results, Markdown reports and SVG charts.

The project is becoming an open source benchmark application with an **Angular GUI**, so you
can run studies, compare models and explore results without touching the command line.
Contributions of new studies, models and hardware results are welcome.
