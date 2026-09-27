// Draws a simple SVG illustration for every product into public/products/<slug>.svg.
// The products are made up, so there are no real photos — this keeps the images consistent
// and avoids any licensing questions. Re-run with `npm run art` after changing products-data.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { products, type SeedProduct } from "../prisma/products-data";

const OUT_DIR = join(process.cwd(), "public", "products");
const ACCENTS = ["#22d3ee", "#a3e635", "#f472b6", "#fb923c", "#a78bfa", "#facc15", "#f87171", "#34d399"];

const BODY = "#1f2430";
const BODY_LIGHT = "#2d3444";
const EDGE = "#3b4356";
const WHITE = "#e5e7eb";

function mouse(p: SeedProduct, a: string) {
  const scale = p.slug === "recoil-mini" ? 0.85 : p.slug === "lowsens-air" ? 1.08 : 1;
  // Ergonomic shape leans right with a thumb groove; the others are symmetrical
  const shell =
    p.slug === "tracer-ergo"
      ? "M395,190 C505,185 545,265 540,350 L530,530 C525,605 470,632 395,630 C315,628 272,598 268,525 C265,470 245,430 262,380 C270,270 300,195 395,190 Z"
      : "M400,190 C500,190 530,260 530,340 L530,520 C530,600 480,630 400,630 C320,630 270,600 270,520 L270,340 C270,260 300,190 400,190 Z";
  const wired = p.specs.Connection?.startsWith("Wired");
  return `
  <g transform="translate(400 410) scale(${scale}) translate(-400 -410)">
    ${wired ? `<path d="M400,192 C400,120 460,90 470,20" stroke="${EDGE}" stroke-width="10" fill="none" stroke-linecap="round"/>` : ""}
    <path d="${shell}" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    <path d="M272,362 Q400,392 528,362" stroke="${EDGE}" stroke-width="4" fill="none"/>
    <line x1="400" y1="194" x2="400" y2="372" stroke="${EDGE}" stroke-width="4"/>
    <rect x="388" y="250" width="24" height="64" rx="12" fill="${a}"/>
    <path d="M278,420 C272,470 274,520 290,560" stroke="${a}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.9"/>
    <path d="M522,420 C528,470 526,520 510,560" stroke="${a}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.9"/>
    <text x="400" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="${a}" opacity="0.85">C</text>
    <ellipse cx="360" cy="300" rx="50" ry="90" fill="#ffffff" opacity="0.05"/>
  </g>`;
}

const KEYBOARD_LAYOUTS: Record<string, { cols: number; fRow: boolean; width: number }> = {
  "60%": { cols: 15, fRow: false, width: 560 },
  "65%": { cols: 16, fRow: false, width: 600 },
  "75%": { cols: 16, fRow: true, width: 610 },
  TKL: { cols: 18, fRow: true, width: 680 },
  "Full size": { cols: 22, fRow: true, width: 720 },
};

function keyboard(p: SeedProduct, a: string) {
  const layoutName = Object.keys(KEYBOARD_LAYOUTS).find((k) => p.specs.Layout?.startsWith(k)) ?? "TKL";
  const { cols, fRow, width } = KEYBOARD_LAYOUTS[layoutName];
  const rows = fRow ? 6 : 5;
  const pad = 18;
  const u = (width - pad * 2) / cols;
  const height = rows * u + pad * 2;
  const x0 = 400 - width / 2;
  const y0 = 410 - height / 2;
  const keys: string[] = [];
  for (let r = 0; r < rows; r++) {
    const isBottom = r === rows - 1;
    const row = fRow ? r - 1 : r; // WASD positions counted from the number row
    for (let c = 0; c < cols; c++) {
      // Bottom row: a wide space bar in the middle
      if (isBottom && c > 3 && c < 10) {
        if (c === 4) keys.push(key(x0 + pad + c * u, y0 + pad + r * u, u * 6, u, BODY_LIGHT));
        continue;
      }
      const wasd = (row === 2 && c === 2) || (row === 3 && c >= 1 && c <= 3);
      const esc = r === 0 && c === 0;
      keys.push(key(x0 + pad + c * u, y0 + pad + r * u, u, u, wasd || esc ? a : BODY_LIGHT));
    }
  }
  return `
    <rect x="${x0}" y="${y0}" width="${width}" height="${height}" rx="18" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    ${keys.join("\n    ")}
    <rect x="${x0 + 6}" y="${y0 + height - 8}" width="${width - 12}" height="4" rx="2" fill="${a}" opacity="0.8"/>`;
}

function key(x: number, y: number, w: number, h: number, fill: string) {
  const g = Math.max(2, h * 0.09);
  return `<rect x="${(x + g).toFixed(1)}" y="${(y + g).toFixed(1)}" width="${(w - g * 2).toFixed(1)}" height="${(h - g * 2).toFixed(1)}" rx="${(h * 0.18).toFixed(1)}" fill="${fill}" stroke="#12151c" stroke-width="1.5"/>`;
}

function headset(p: SeedProduct, a: string) {
  if (p.slug === "clutch-iem") {
    return `
    <path d="M300,330 C300,470 400,470 400,560 M500,330 C500,470 400,470 400,560 M400,560 L400,700" stroke="${EDGE}" stroke-width="8" fill="none" stroke-linecap="round"/>
    ${[300, 500]
      .map(
        (x) => `<g><ellipse cx="${x}" cy="280" rx="70" ry="60" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
      <circle cx="${x}" cy="280" r="30" fill="${a}"/><circle cx="${x}" cy="280" r="14" fill="${BODY}"/></g>`
      )
      .join("")}
    <rect x="386" y="600" width="28" height="44" rx="10" fill="${BODY_LIGHT}" stroke="${EDGE}" stroke-width="3"/>`;
  }
  const openBack = p.specs.Design === "Open-back";
  const grille = openBack
    ? [0, 1, 2, 3, 4, 5]
        .map((i) => `<circle cx="0" cy="0" r="${18 + i * 12}" fill="none" stroke="${EDGE}" stroke-width="3"/>`)
        .join("")
    : "";
  const cup = (x: number) => `
    <g transform="translate(${x} 470)">
      <rect x="-40" y="-90" width="80" height="40" rx="12" fill="${BODY_LIGHT}" stroke="${EDGE}" stroke-width="3"/>
      <ellipse cx="0" cy="0" rx="85" ry="105" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
      <ellipse cx="0" cy="0" rx="70" ry="90" fill="none" stroke="${a}" stroke-width="6"/>
      ${grille}
    </g>`;
  const mic =
    p.specs.Microphone && p.slug !== "footstep-x"
      ? `<path d="M235,520 C230,610 300,650 370,640" stroke="${EDGE}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="378" cy="638" r="16" fill="${a}"/>`
      : "";
  return `
    <path d="M250,390 C250,170 550,170 550,390" stroke="${BODY_LIGHT}" stroke-width="36" fill="none" stroke-linecap="round"/>
    <path d="M262,360 C262,200 538,200 538,360" stroke="${a}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.8"/>
    ${cup(250)}${cup(550)}${mic}`;
}

function mousepad(p: SeedProduct, a: string) {
  const [w, h] = (p.specs.Size ?? "450 × 400").split("×").map((n) => parseFloat(n));
  const scale = 640 / Math.max(w, h * 1.4);
  const pw = w * scale;
  const ph = h * scale;
  const x = 400 - pw / 2;
  const y = 420 - ph / 2;
  const glass = p.slug === "glass-pad";
  return `
    <rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="22" fill="${glass ? "url(#glass)" : "url(#pad)"}" stroke="${EDGE}" stroke-width="4"/>
    ${glass ? `<path d="M${x + pw * 0.1},${y + ph} L${x + pw * 0.45},${y} L${x + pw * 0.55},${y} L${x + pw * 0.2},${y + ph} Z" fill="#ffffff" opacity="0.06"/>` : `<rect x="${x + 10}" y="${y + 10}" width="${pw - 20}" height="${ph - 20}" rx="16" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="10 8" opacity="0.8"/>`}
    <text x="${x + pw - 34}" y="${y + ph - 34}" text-anchor="end" font-family="Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="4" fill="${a}">CLUTCH GEAR</text>`;
}

function accessory(p: SeedProduct, a: string) {
  switch (p.slug) {
    case "cable-bungee":
      return `
    <ellipse cx="400" cy="560" rx="150" ry="56" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    <ellipse cx="400" cy="548" rx="110" ry="36" fill="none" stroke="${a}" stroke-width="5"/>
    <path d="M400,540 C400,420 420,330 470,260" stroke="${BODY_LIGHT}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <circle cx="474" cy="254" r="22" fill="${a}"/>
    <path d="M150,300 C300,230 420,250 474,254 C560,258 640,330 690,420" stroke="${EDGE}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    case "coiled-cable": {
      const coils = Array.from({ length: 11 }, (_, i) => `<ellipse cx="${250 + i * 30}" cy="420" rx="22" ry="62" fill="none" stroke="${a}" stroke-width="10"/>`).join("");
      return `
    <path d="M100,300 C160,300 200,420 230,420 M570,420 C610,420 640,540 700,540" stroke="${a}" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${coils}
    <rect x="70" y="276" width="40" height="48" rx="8" fill="${WHITE}"/>
    <rect x="690" y="516" width="44" height="48" rx="8" fill="${WHITE}"/>
    <rect x="600" y="400" width="44" height="40" rx="10" fill="${BODY_LIGHT}" stroke="${EDGE}" stroke-width="3"/>`;
    }
    case "wrist-rest":
      return `
    <rect x="110" y="340" width="580" height="150" rx="75" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    <rect x="126" y="356" width="548" height="118" rx="59" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="10 8"/>
    <ellipse cx="330" cy="385" rx="160" ry="18" fill="#ffffff" opacity="0.05"/>`;
    case "glide-skates":
      return `
    <rect x="190" y="220" width="420" height="400" rx="30" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    <rect x="250" y="270" width="300" height="46" rx="23" fill="${WHITE}"/>
    <rect x="250" y="530" width="300" height="46" rx="23" fill="${WHITE}"/>
    <circle cx="320" cy="423" r="40" fill="${WHITE}"/><circle cx="480" cy="423" r="40" fill="${WHITE}"/>
    <rect x="190" y="220" width="420" height="16" rx="8" fill="${a}"/>`;
    case "grip-tape":
      return `
    <rect x="180" y="220" width="440" height="400" rx="30" fill="#ffffff" opacity="0.04" stroke="${EDGE}" stroke-width="4"/>
    ${[
      "M220,260 C300,250 340,300 330,400 L230,410 C215,360 210,300 220,260 Z",
      "M580,260 C500,250 460,300 470,400 L570,410 C585,360 590,300 580,260 Z",
      "M240,450 L360,450 L350,580 L250,580 Z",
      "M440,450 L560,450 L550,580 L450,580 Z",
    ]
      .map((d) => `<path d="${d}" fill="url(#grip)" stroke="${a}" stroke-width="4"/>`)
      .join("")}`;
    case "headset-stand":
      return `
    <rect x="260" y="610" width="280" height="40" rx="14" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    <rect x="382" y="250" width="36" height="370" rx="10" fill="${BODY_LIGHT}" stroke="${EDGE}" stroke-width="3"/>
    <path d="M300,260 C300,190 500,190 500,260" stroke="${BODY_LIGHT}" stroke-width="30" fill="none" stroke-linecap="round"/>
    <rect x="300" y="620" width="30" height="14" rx="3" fill="${a}"/><rect x="340" y="620" width="30" height="14" rx="3" fill="${a}"/>
    <line x1="382" y1="330" x2="418" y2="330" stroke="${a}" stroke-width="6"/>`;
    default:
      // Dongle extender (and the fallback for any future accessory)
      return `
    <rect x="300" y="470" width="200" height="120" rx="24" fill="url(#body)" stroke="${EDGE}" stroke-width="4"/>
    <rect x="370" y="410" width="60" height="70" rx="8" fill="${BODY_LIGHT}" stroke="${EDGE}" stroke-width="3"/>
    <rect x="384" y="380" width="32" height="36" rx="4" fill="${a}"/>
    <path d="M500,540 C600,540 620,380 700,330" stroke="${EDGE}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="320" y="560" width="160" height="6" rx="3" fill="${a}" opacity="0.8"/>`;
  }
}

function svg(p: SeedProduct, index: number) {
  const a = ACCENTS[index % ACCENTS.length];
  const drawing = {
    MICE: mouse,
    KEYBOARDS: keyboard,
    HEADSETS: headset,
    MOUSEPADS: mousepad,
    ACCESSORIES: accessory,
  }[p.category](p, a);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${p.name}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="70%">
      <stop offset="0" stop-color="#1b2030"/><stop offset="1" stop-color="#0b0d12"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${a}" stop-opacity="0.35"/><stop offset="1" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BODY_LIGHT}"/><stop offset="1" stop-color="${BODY}"/>
    </linearGradient>
    <linearGradient id="pad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#171b25"/><stop offset="1" stop-color="#232938"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a3346"/><stop offset="0.5" stop-color="#1a2030"/><stop offset="1" stop-color="#303a50"/>
    </linearGradient>
    <pattern id="grip" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="${BODY}"/><circle cx="5" cy="5" r="2" fill="${BODY_LIGHT}"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <ellipse cx="400" cy="430" rx="340" ry="300" fill="url(#glow)"/>
  <ellipse cx="400" cy="700" rx="260" ry="28" fill="#000000" opacity="0.35"/>
  ${drawing}
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
products.forEach((p, i) => writeFileSync(join(OUT_DIR, `${p.slug}.svg`), svg(p, i)));
console.log(`Wrote ${products.length} images to public/products/`);
