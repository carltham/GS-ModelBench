// Sections by metric, then model, then request kind, one bar per context size.
import { BAR_X, BAR_W, COLORS, close, open, text } from "../svg.mjs";

const SECTIONS = [
  { title: "VALID JSON", key: "validJsonPct" },
  { title: "KIND ACCURACY", key: "kindAccuracyPct" },
  { title: "DIFFICULTY EXACT", key: "difficultyExactPct" },
];

export function kindChart({ rows, kinds, models }) {
  const BH = 11;
  const GAP = 1;
  const X0 = 130;
  const W = 900;
  const groups = models.filter((m) => rows.some((r) => r.model === m));
  const contexts = [...new Set(rows.map((r) => r.numCtx ?? null))].sort((a, b) => (a ?? 0) - (b ?? 0));
  const color = (ctx) => COLORS[Math.max(0, contexts.indexOf(ctx)) % COLORS.length];
  const kindH = (rs) => rs.length * (BH + GAP) + 8;
  const H =
    110 +
    SECTIONS.reduce(
      (h) =>
        h +
        30 +
        groups.reduce((hh, model) => {
          const rs = rows.filter((r) => r.model === model);
          return hh + 22 + kinds.length * kindH(rs) + 10;
        }, 0),
      0,
    );

  const out = [open(W, H)];
  out.push(text(20, 28, "Results per request kind: by metric, then model, then kind (%)", 'font-size="18" font-weight="bold"'));
  out.push(
    text(20, 46, "Sections: Valid JSON, Kind accuracy, Difficulty exact. Within each: one block per model, one group per request kind, one bar per context size. 0-100 scale.", 'font-size="11" fill="#666"'),
  );
  contexts.forEach((ctx, i) => {
    const x = 20 + i * 130;
    out.push(`<rect x="${x}" y="58" width="12" height="12" fill="${color(ctx)}"/>${text(x + 18, 68, ctx ? `ctx ${ctx}` : "ctx n/a", 'font-size="11"')}`);
  });

  let y = 90;
  const BX = X0;
  const BW = W - X0 - 70;
  for (const sec of SECTIONS) {
    out.push(
      `<rect x="20" y="${y}" width="${W - 40}" height="24" fill="#2f3b4c"/>${text(28, y + 16, sec.title, 'font-weight="bold" fill="#fff" font-size="13"')}`,
    );
    y += 30;
    for (const model of groups) {
      const rs = rows.filter((r) => r.model === model);
      out.push(
        `<rect x="20" y="${y}" width="${W - 40}" height="18" fill="#dfe6ee"/>${text(28, y + 13, model, 'font-weight="bold"')}`,
      );
      for (let g = 0; g <= 4; g++) {
        out.push(text(BX + (g / 4) * BW, y + 13, g * 25, 'text-anchor="middle" font-size="9" fill="#666"'));
      }
      y += 22;
      const top = y;
      for (const k of kinds) {
        out.push(text(28, y + kindH(rs) / 2, k));
        rs.forEach((r, i) => {
          const v = r.perKind[k][sec.key];
          const by = y + i * (BH + GAP);
          const w = (v / 100) * BW;
          out.push(
            `<rect x="${BX}" y="${by}" width="${w}" height="${BH}" fill="${color(r.numCtx ?? null)}"/>${text(BX + w + 4, by + BH - 2, `${v}%`, 'font-size="9"')}`,
          );
        });
        y += kindH(rs);
        out.push(`<line x1="20" x2="${W - 20}" y1="${y - 4}" y2="${y - 4}" stroke="#eee"/>`);
      }
      for (let g = 0; g <= 4; g++) {
        const x = BX + (g / 4) * BW;
        out.push(`<line x1="${x}" x2="${x}" y1="${top}" y2="${y}" stroke="#e5e5e5"/>`);
      }
      y += 10;
    }
  }
  out.push(close);
  return out.join("\n");
}
