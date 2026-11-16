// Assembles the Markdown summary that embeds the charts.
export function buildMarkdown({ rows, byModel, settings, charts, today }) {
  const md = [
    `# Classifier evaluation — summary of all runs (${today})`,
    "",
    "Built from every `classifications-*.json` in this folder by `../build-classifier-summary.mjs`. 24 prompts × 3 repeats = 72 calls per model per run. Each chart shows every model run (model + test date) on one shared scale so models can be compared directly.",
    "",
  ];

  for (const chart of charts) {
    md.push(`## ${chart.title}`, "", `![${chart.title}](${chart.file})`, "");
  }

  md.push(
    "## Numbers",
    "",
    "| Model | Run (UTC) | num_ctx | Valid JSON | Kind | Diff exact | Diff ±1 | Consistency | Median ms | P95 ms |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const r of rows) {
    const s = r.stats;
    md.push(
      `| \`${r.model}\` | ${r.tested} | ${r.numCtx ?? "n/a"} | ${s.validJsonPct}% | ${s.kindAccuracyPct}% | ${s.difficultyExactPct}% | ${s.difficultyWithinOnePct}% | ${s.consistentPct}% | ${s.medianMs} | ${s.p95Ms} |`,
    );
  }

  const missing = settings.models.filter((m) => !byModel.has(m));
  md.push(
    "",
    "## Models with no results in any JSON yet",
    "",
    "These models are configured but have no `classifications-*.json` entry, so they are not in the charts above. A model can already have preliminary numbers in a run report (`classifications-<date>.md`) before its JSON entry exists.",
    "",
    missing.map((m) => `- \`${m}\``).join("\n") || "- none",
    "",
  );

  md.push(
    "## Rules of reporting",
    "",
    "Rules the project owner gave for these reports:",
    "",
    "- The results folder is called `classifier-evaluation-results`.",
    '- JSON files are named `classifications-<test start>.json` and contain a top-level `"tested"` field with the test start date and time.',
    "- Report files are named `classifications-<date>.md`; the date, filename and contents must agree with the run's `tested` date.",
    "- Every report names its source JSON in a `Source:` line.",
    "- Run all configured models, including the ones already pulled, starting with the ones not yet pulled.",
    "- Update the results, the report and the charts as each model's results come in, and report progress while tests are running.",
    "- Do not delete files without explicit confirmation.",
    "",
  );

  return md.join("\n");
}
