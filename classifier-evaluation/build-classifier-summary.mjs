// Builds the per-run, per-metric and per-kind SVG charts plus the Markdown summary
// from every classifications-*.json in classifier-evaluation-results/.
// Usage: node classifier-evaluation/build-classifier-summary.mjs
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { groupedChart } from "./summary/charts/grouped.mjs";
import { kindChart } from "./summary/charts/per-kind.mjs";
import { runChart } from "./summary/charts/per-run.mjs";
import { loadResults, toRows } from "./summary/load-results.mjs";
import { kinds, resultsDir, settings } from "./summary/paths.mjs";
import { buildMarkdown } from "./summary/report.mjs";

const METRICS = [
  ["validJsonPct", "Valid JSON"],
  ["kindAccuracyPct", "Kind"],
  ["difficultyExactPct", "Difficulty exact"],
  ["difficultyWithinOnePct", "Difficulty ±1"],
  ["consistentPct", "Consistency"],
];

const { byModel } = loadResults(resultsDir, kinds);
const rows = toRows(byModel, settings);
const models = settings.models.filter((m) => byModel.has(m));
const maxLatency = Math.ceil(Math.max(...rows.map((r) => r.stats.p95Ms)) / 1000) * 1000;

const charts = [
  { file: "summary-0-per-run.svg", title: "All metrics per model and context", svg: runChart(rows, kinds) },
  ...METRICS.map(([key, name], i) => ({
    file: `metric-${i + 1}-${key}.svg`,
    title: `${name} (%) — all models and runs`,
    svg: groupedChart(rows, `${name} (%) — all models and runs`, [{ name, key }], (r, s) => r.stats[s.key], 100, "%"),
  })),
  {
    file: "metric-6-medianMs.svg",
    title: "Median latency (ms) — all models and runs",
    svg: groupedChart(rows, "Median latency (ms) — all models and runs", [{ name: "Median ms", key: "medianMs" }], (r, s) => r.stats[s.key], maxLatency, ""),
  },
  {
    file: "metric-7-p95Ms.svg",
    title: "P95 latency (ms) — all models and runs",
    svg: groupedChart(rows, "P95 latency (ms) — all models and runs", [{ name: "P95 ms", key: "p95Ms" }], (r, s) => r.stats[s.key], maxLatency, ""),
  },
  {
    file: "summary-3-per-kind.svg",
    title: "Results per request kind, all models and runs",
    svg: kindChart({ rows, kinds, models }),
  },
];

for (const chart of charts) writeFileSync(join(resultsDir, chart.file), chart.svg);

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(resultsDir, `summary-report-${today}.md`),
  buildMarkdown({ rows, byModel, settings, charts, today }),
);

console.log(`models: ${[...byModel.keys()].join(", ")}; rows: ${rows.length}`);
