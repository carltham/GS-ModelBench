// Small SVG helpers shared by the chart modules.
export const COLORS = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#b07aa1", "#76b7b2"];
export const BAR_X = 260;
export const BAR_W = 560;
export const BAR_H = 12;

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const text = (x, y, s, o = "") =>
  `<text x="${x}" y="${y}" font-family="sans-serif"${o.includes("font-size") ? "" : ' font-size="12"'}${o.includes("fill") ? "" : ' fill="#222"'} ${o}>${esc(s)}</text>`;

export const open = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/>`;

export const close = "</svg>";
