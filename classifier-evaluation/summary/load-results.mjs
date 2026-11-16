// Reads every classifications-*.json and derives per-model, per-run and per-kind figures.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pct = (part, whole) => (whole ? Math.round((100 * part) / whole) : 0);

function kindBreakdown(entry, kinds) {
  const kindAcc = {};
  const perKind = {};
  for (const k of kinds) {
    let n = 0;
    let valid = 0;
    let kindOk = 0;
    let diffOk = 0;
    for (const run of entry.runs.filter((r) => r.expected.kind === k)) {
      for (const res of run.results) {
        n++;
        if (res.valid) valid++;
        if (res.valid && res.kind === k) kindOk++;
        if (res.valid && res.difficulty === run.expected.difficulty) diffOk++;
      }
    }
    kindAcc[k] = pct(kindOk, n);
    perKind[k] = {
      validJsonPct: pct(valid, n),
      kindAccuracyPct: pct(kindOk, n),
      difficultyExactPct: pct(diffOk, n),
    };
  }
  return { kindAcc, perKind };
}

export function loadResults(resultsDir, kinds) {
  const byModel = new Map();
  const files = readdirSync(resultsDir)
    .filter((f) => /^classifications-.*\.json$/.test(f))
    .sort();

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(resultsDir, file), "utf8"));
    for (const entry of data.report) {
      const tested = entry.tested ?? data.tested;
      const { kindAcc, perKind } = kindBreakdown(entry, kinds);
      if (!byModel.has(entry.stats.model)) byModel.set(entry.stats.model, []);
      byModel
        .get(entry.stats.model)
        .push({ tested, file, numCtx: data.numCtx ?? null, stats: entry.stats, kindAcc, perKind });
    }
  }
  for (const runs of byModel.values()) runs.sort((a, b) => a.tested.localeCompare(b.tested));

  return { byModel, files };
}

export function toRows(byModel, settings) {
  const rows = [];
  for (const [model, runs] of byModel) {
    for (const r of runs) {
      const ctx = r.numCtx ? `ctx ${r.numCtx}` : "ctx n/a";
      rows.push({
        model,
        run: r.tested,
        runLabel: `${r.tested.slice(0, 10)} · ${ctx}`,
        label: `${model} - ${ctx}`,
        ...r,
      });
    }
  }
  rows.sort(
    (a, b) =>
      settings.models.indexOf(a.model) - settings.models.indexOf(b.model) ||
      (a.numCtx ?? 0) - (b.numCtx ?? 0),
  );  return rows;
}
