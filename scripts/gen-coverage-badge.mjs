import fs from 'node:fs';
import path from 'node:path';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pickColor(pct) {
  // simple "shields-ish" palette
  if (pct >= 95) return '#2ea44f'; // green
  if (pct >= 90) return '#97ca00'; // yellowgreen
  if (pct >= 80) return '#dfb317'; // yellow
  if (pct >= 70) return '#fe7d37'; // orange
  return '#e05d44'; // red
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const summaryPath = path.resolve('coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error(`Missing ${summaryPath}. Did coverage run?`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const pctRaw = summary?.total?.lines?.pct;

if (typeof pctRaw !== 'number') {
  console.error('Could not read total.lines.pct from coverage-summary.json');
  process.exit(1);
}

const pct = clamp(pctRaw, 0, 100);
const pctText = `${pct.toFixed(2)}%`;

const label = 'coverage';
const value = pctText;

const leftText = esc(label);
const rightText = esc(value);

const leftWidth = 68;
const rightWidth = 74;
const width = leftWidth + rightWidth;

const color = pickColor(pct);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${leftText}: ${rightText}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
    <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
    <stop offset="1" stop-color="#000" stop-opacity=".5"/>
  </linearGradient>

  <clipPath id="r">
    <rect width="${width}" height="20" rx="3" fill="#fff"/>
  </clipPath>

  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>

  <g fill="#fff" text-anchor="middle"
     font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
     font-size="11">
    <text x="${Math.floor(leftWidth / 2)}" y="14">${leftText}</text>
    <text x="${leftWidth + Math.floor(rightWidth / 2)}" y="14">${rightText}</text>
  </g>
</svg>
`;

const outDir = path.resolve('badges');
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'coverage.svg');
fs.writeFileSync(outPath, svg, 'utf8');

console.log(`Wrote ${outPath} (${pctText})`);
