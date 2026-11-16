// One section per run, one row per model, every metric as a coloured column.
import { close, open, text } from "../svg.mjs";

const METRICS = [
  ["validJsonPct", "Valid JSON"],
  ["kindAccuracyPct", "Kind"],
  ["difficultyExactPct", "Difficulty exact"],
  ["difficultyWithinOnePct", "Difficulty ±1"],
  ["consistentPct", "Consistency"],
];

export function runChart(rows, kinds) {
  const cols = [
    ...METRICS.map(([key, name]) => ({ name, get: (r) => r.stats[key], kind: "pct" })),
    { name: "Median ms", get: (r) => r.stats.medianMs, kind: "ms" },
    { name: "P95 ms", get: (r) => r.stats.p95Ms, kind: "ms" },
    ...kinds.map((k) => ({ name: `${k} acc`, get: (r) => r.kindAcc[k], kind: "pct" })),
  ];
  const maxMs = Math.max(...rows.map((r) => r.stats.p95Ms));
  const X0 = 170;
  const CW = 56;
  const RH = 24;
  const HEAD = 46;
  const W = X0 + cols.length * CW + 20;
  const groups = [...new Set(rows.map((r) => r.model))];
  const H =
    70 + groups.reduce((h, model) => h + HEAD + rows.filter((r) => r.model === model).length * RH + 18, 0);

  const out = [open(W, H)];
  out.push(text(20, 28, "All metrics per model and context", 'font-size="18" font-weight="bold"'));
  out.push(
    text(20, 46, "Percent cells: green = high, red = low. Latency cells: green = fast, red = slow (scale 0 to the slowest p95).", 'font-size="11" fill="#666"'),
  );
  const shade = (good) => `hsl(${Math.round(good * 120)},60%,${80 - 20 * Math.abs(good - 0.5)}%)`;

  let y = 70;
  for (const model of groups) {
    const rs = rows.filter((r) => r.model === model);
    out.push(
      `<rect x="20" y="${y}" width="${W - 40}" height="22" fill="#dfe6ee"/>${text(28, y + 15, `${model}  (${rs.length} context size${rs.length > 1 ? "s" : ""})`, 'font-weight="bold"')}`,
    );
    cols.forEach((c, ci) => {
      out.push(text(X0 + ci * CW + CW / 2, y + 38, c.name.replace(" acc", ""), 'text-anchor="middle" font-size="9"'));
    });
    y += HEAD;
    for (const r of rs) {
      out.push(text(28, y + 16, r.label));
      cols.forEach((c, ci) => {
        const v = c.get(r);
        const good = c.kind === "pct" ? v / 100 : 1 - v / maxMs;
        out.push(
          `<rect x="${X0 + ci * CW}" y="${y}" width="${CW - 2}" height="${RH - 2}" fill="${shade(good)}"/>${text(X0 + ci * CW + (CW - 2) / 2, y + 15, c.kind === "pct" ? `${v}%` : v, 'text-anchor="middle" font-size="10"')}`,
        );
      });
      y += RH;
    }
    y += 18;
  }
  out.push(close);
  return out.join("\n");
}
