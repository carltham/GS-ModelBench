// One metric per chart: every model run as a row, grouped by test run.
import { BAR_H, BAR_W, BAR_X, COLORS, close, open, text } from "../svg.mjs";

export function groupedChart(rows, title, series, valueOf, maxValue, unit) {
  const groupH = series.length * (BAR_H + 2) + 14;
  const top = 90;
  const H = top + rows.length * groupH + 20;
  const W = 900;
  const out = [open(W, H)];

  out.push(text(20, 28, title, 'font-size="18" font-weight="bold"'));
  out.push(
    text(20, 46, "Rows grouped by model, one row per context size. Same scale on every row.", 'font-size="11" fill="#666"'),
  );
  series.forEach((s, i) => {
    const x = 20 + i * 140;
    out.push(`<rect x="${x}" y="58" width="12" height="12" fill="${COLORS[i]}"/>${text(x + 18, 68, s.name)}`);
  });
  for (let g = 0; g <= 4; g++) {
    const x = BAR_X + (g / 4) * BAR_W;
    out.push(
      `<line x1="${x}" x2="${x}" y1="${top - 8}" y2="${H - 20}" stroke="#e5e5e5"/>${text(x, top - 12, Math.round((g / 4) * maxValue), 'text-anchor="middle" font-size="10" fill="#666"')}`,
    );
  }
  rows.forEach((row, ri) => {
    const y0 = top + ri * groupH;
    if (ri > 0 && rows[ri - 1].model !== row.model) {
      out.push(`<line x1="20" x2="${W - 20}" y1="${y0 - 3}" y2="${y0 - 3}" stroke="#999"/>`);
    }
    out.push(text(20, y0 + groupH / 2 - 2, row.label));
    series.forEach((s, si) => {
      const v = valueOf(row, s);
      const y = y0 + si * (BAR_H + 2);
      const w = (v / maxValue) * BAR_W;
      out.push(
        `<rect x="${BAR_X}" y="${y}" width="${w}" height="${BAR_H}" fill="${COLORS[si]}"/>${text(BAR_X + w + 4, y + BAR_H - 2, `${v}${unit}`, 'font-size="10"')}`,
      );
    });
  });
  out.push(close);
  return out.join("\n");
}
