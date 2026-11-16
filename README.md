# GS-ModelBench

Benchmarks of small local LLMs (via Ollama) on concrete tasks, measured on real hardware.

## Studies

- [`classifier-evaluation/`](classifier-evaluation/): can a local model label a chat request with
  a request kind and a difficulty level, accurately and fast enough to sit on a router's request
  path? Nine models, 24 labelled prompts, four context sizes. Method in
  [`how-we-test.md`](classifier-evaluation/how-we-test.md), conclusion in
  [`conclusion-2026-11-14.md`](classifier-evaluation/classifier-evaluation-results/conclusion-2026-11-14.md).

## Requirements

- Node.js 20 or later (no npm dependencies)
- A running Ollama server with the models listed in each study's settings file

## Run

From the repository root:

```sh
node classifier-evaluation/run-classifier-evaluation.mjs --num-ctx 4096
node classifier-evaluation/build-classifier-summary.mjs
```

## License

Apache License 2.0, see [LICENSE](LICENSE).
