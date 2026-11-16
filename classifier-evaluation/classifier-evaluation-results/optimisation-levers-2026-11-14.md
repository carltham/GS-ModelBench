# Measured optimisation levers for `qwen3.5:4b`

Date: 2026-11-14 (UTC). Machine: GTX 1050 4 GB, 8 CPU cores, 31 GB RAM, Ollama 0.33.1.
Every number below was measured on this machine. Nothing here is estimated from documentation.

## Method

Benchmark script: `/tmp/bench-ctx.mjs` (outside the repo, not part of the evaluation suite).
Per call: one fixed 53-token classification prompt, `format: "json"`, `temperature: 0`,
`num_predict: 60`, `think: false`, 15 output tokens, 20 calls per leg, median and p95 over those
20 calls. The model is unloaded (`keep_alive: 0`) between legs so each leg pays its own load cost.
VRAM and GPU share come from `/api/ps` after the leg.

## 1. Context size (cooled series, 4096 as reference)

| num_ctx | median ms | p95 ms | min | max | VRAM B | GPU % | reload ms | Δ median vs 4096 |
|---|---|---|---|---|---|---|---|---|
| 2048 | 1298 | 7433 | 1254 | 7433 | 3134293616 | 82 | 5887 | −5.3% |
| 4096 | 1371 | 8918 | — | 8918 | 3213775676 | 80 | 7248 | reference |
| 8192 | 1589 | 10993 | — | 10993 | 3373159229 | 76 | 9162 | +15.9% |
| 16384 | 2116 | 12871 | — | 12871 | 3682971493 | 68 | 10644 | +33.2% |

2048 → 16384: median +63.0%, p95 +73.2%, VRAM +549 MB. Accuracy does not change with context in the
four campaign JSONs; only latency and VRAM do.

## 2. Output cap (`num_predict` 60 → 16, 4096 ctx)

| Setting | median ms | output tokens |
|---|---|---|
| `num_predict: 60` | 1368 | 14 |
| `num_predict: 16` | 1282 | 14 |

Δ median −6.5%. The model stops at 14 tokens either way, so the cap only removes headroom, it does
not shorten the answer.

## 3. GPU temperature (4096 ctx, same model and prompt)

| State | median ms | p95 ms |
|---|---|---|
| Cooled (GPU ≤ 70 °C at start) | 1371 | 8918 |
| Hot (GPU 93 °C, SM 1354 MHz) | 2832–3097 | 3393–3787 |

Hot legs are 2.07–2.26× slower at the same settings. Any latency comparison taken without a cooled
start mixes this factor in.

## 4. Flash attention + KV cache q8_0 (4096 ctx, A/B, 6 legs)

Second Ollama server on `127.0.0.1:11435` with `OLLAMA_FLASH_ATTENTION=1` and
`OLLAMA_KV_CACHE_TYPE=q8_0`; baseline on the normal server `127.0.0.1:11434` with neither variable.
Server log confirms the flags reached llama-server: `--cache-type-k q8_0 --cache-type-v q8_0
--flash-attn on`, `llama_context: flash_attn = enabled`, KV cache `K (q8_0): 34.00 MiB,
V (q8_0): 34.00 MiB`.

| Leg | Server | median ms | p95 ms | min | max | VRAM B | GPU % | load ms |
|---|---|---|---|---|---|---|---|---|
| A1 | baseline 11434 | 1978 | 13983 | 1734 | 13983 | 3213775676 | 80 | 11551 |
| B1 | FA + q8_0 11435 | 2727 | 16281 | 1591 | 16281 | 3151836292 | 80 | 12812 |
| A2 | baseline 11434 | 1720 | 13281 | 1604 | 13281 | 3213775676 | 80 | 11386 |
| B2 | FA + q8_0 11435 | 2166 | 15026 | 1887 | 15026 | 3151836292 | 80 | 12801 |
| A3 | baseline 11434 | 2097 | 12918 | 1920 | 12918 | 3213775676 | 80 | 10620 |
| B3 | FA + q8_0 11435 | 2218 | 13667 | 1978 | 13667 | 3151836292 | 80 | 11271 |

Means over the three legs of each arm:

| Metric | baseline | FA + q8_0 | Δ |
|---|---|---|---|
| median ms | 1931.7 | 2370.3 | +22.7% |
| p95 ms | 13394 | 14991.3 | +11.9% |
| VRAM B | 3213775676 | 3151836292 | −61.9 MB (−1.9%) |
| load ms | 11185.7 | 12294.7 | +9.9% |

Paired, in run order: B1/A1 +37.9%, B2/A2 +25.9%, B3/A3 +5.8%. Baseline medians spread 1720–2097 ms,
FA medians 2166–2727 ms; the two arms do not overlap. The effect is smaller in the later, hotter legs,
which is the opposite of what thermal drift alone would produce.

## 5. What these numbers do and do not support

- Measured: context size, output cap, GPU temperature, flash attention with KV q8_0, VRAM, reload cost.
- Not measured: speculative decoding / MTP, custom kernels, batch or parallel request handling,
  quantisation below Q4_K_M, a second concurrent request stream.
- The FA + q8_0 arm is slower on this GPU at 4096 context in all three pairs, and saves 61.9 MB of
  VRAM. The 4 GB card has no VRAM pressure at 4096 (80% GPU share, no CPU spill in these legs), so the
  saving buys nothing here.
- All legs ran with other work on the machine; absolute milliseconds move between sessions, the
  within-session pairs are the comparable unit.
