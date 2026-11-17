import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');

export type InitialScorecardCategory = {
  categoryKey?: string;
  categoryLabel: string;
  scoreTenScale: number;
  scorePercentage?: number;
  rank?: number;
};

export type InitialScorecardPdfData = {
  projectName: string;
  jurisdictionLabel: string;
  year?: number | null;
  overallScoreTenScale: number;
  overallScorePercentage?: number;
  performanceBand: string;
  categoryScores: InitialScorecardCategory[];
};

const GOLD = '#C5A35A';
const INK = '#1F2937';
const MUTED = '#6B7280';
const ICON_BG = '#E5E7EB';

/**
 * Positioned gradient stops sampled from Lee County book p.6 score bars.
 * Long yellow mid-band, then light green, then solid forest green at the end.
 */
const FADE_STOPS: Array<{ t: number; c: [number, number, number] }> = [
  { t: 0.0, c: [255, 0, 0] },
  { t: 0.12, c: [255, 80, 0] },
  { t: 0.18, c: [255, 255, 0] },
  { t: 0.6, c: [255, 255, 0] },
  { t: 0.68, c: [169, 209, 142] },
  { t: 0.88, c: [169, 209, 142] },
  { t: 0.94, c: [84, 130, 53] },
  { t: 1.0, c: [84, 130, 53] },
];

/** Short one-line blurbs for the Quality of Life PDF (matches marketing mockup density). */
const CATEGORY_BLURBS: Record<string, string> = {
  'accessibility & transportation':
    'How well can residents, visitors and workers move in and around your community?',
  'arts & culture': 'Does your community foster and support local and visiting artists?',
  'crime & public safety': 'Do residents, visitors and workers feel safe in your community?',
  education: 'Does your community provide resources for educational attainment?',
  'employment & labor':
    'Is there a balanced workforce that provides business opportunity and expansion?',
  'goods & services': 'Are there adequate offerings for food, beverages and other goods?',
  'healthcare & wellness': 'What is the status of public health and access to medical care?',
  'historic preservation': 'Does your community preserve and honor its historic assets?',
  'population & housing': 'Is housing supply diverse, attainable, and aligned with local demand?',
  housing: 'Is housing supply diverse, attainable, and aligned with local demand?',
  infrastructure: 'Are utilities and broadband ready for sustainable growth?',
  'open space & recreation': 'Do parks and recreation assets attract residents and investment?',
  'planning & land use': 'Is land use balanced for prosperity without unmanaged sprawl?',
};

const CATEGORY_ICON_SLUGS: Record<string, string> = {
  'accessibility & transportation': 'accessibility-transportation',
  'arts & culture': 'arts-culture',
  'crime & public safety': 'crime-public-safety',
  education: 'education',
  'employment & labor': 'employment-labor',
  'goods & services': 'goods-services',
  'healthcare & wellness': 'healthcare-wellness',
  'historic preservation': 'historic-preservation',
  'population & housing': 'population-housing',
  housing: 'population-housing',
  infrastructure: 'infrastructure',
  'open space & recreation': 'open-space-recreation',
  'planning & land use': 'planning-land-use',
};

const SECTION_ORDER = [
  'Accessibility & Transportation',
  'Arts & Culture',
  'Crime & Public Safety',
  'Education',
  'Employment & Labor',
  'Goods & Services',
  'Healthcare & Wellness',
  'Historic Preservation',
  'Population & Housing',
  'Infrastructure',
  'Open Space & Recreation',
  'Planning & Land Use',
];

function resolveLogoPath(): string | null {
  const local = path.resolve(process.cwd(), 'assets', 'logo.png');
  return fs.existsSync(local) ? local : null;
}

function normKey(label: string): string {
  return String(label || '')
    .trim()
    .toLowerCase();
}

function categoryIconSlug(label: string): string | null {
  const key = normKey(label);
  if (!key) return null;
  if (CATEGORY_ICON_SLUGS[key]) return CATEGORY_ICON_SLUGS[key];
  for (const [k, slug] of Object.entries(CATEGORY_ICON_SLUGS)) {
    if (key.includes(k) || k.includes(key)) return slug;
  }
  return null;
}

function resolveCategoryIconPath(label: string): string | null {
  const slug = categoryIconSlug(label);
  if (!slug) return null;
  const local = path.resolve(process.cwd(), 'assets', 'category-icons', `${slug}.png`);
  return fs.existsSync(local) ? local : null;
}

function categoryBlurb(label: string): string {
  const key = normKey(label);
  if (CATEGORY_BLURBS[key]) return CATEGORY_BLURBS[key];
  for (const [k, blurb] of Object.entries(CATEGORY_BLURBS)) {
    if (key.includes(k) || k.includes(key)) return blurb;
  }
  return 'Quality of life indicator for this community module.';
}

function toPct(ten: number, pct?: number): number {
  if (pct != null && Number.isFinite(Number(pct))) {
    return Math.max(0, Math.min(100, Math.round(Number(pct))));
  }
  return Math.max(0, Math.min(100, Math.round((Number(ten) || 0) * 10)));
}

function shortLabel(label: string, max = 10): string {
  const s = String(label || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(1, max - 1))}…`;
}

function sortCategories(cats: InitialScorecardCategory[]): InitialScorecardCategory[] {
  const byLabel = new Map(cats.map((c) => [normKey(c.categoryLabel), c]));
  const ordered: InitialScorecardCategory[] = [];
  for (const name of SECTION_ORDER) {
    const hit = byLabel.get(normKey(name));
    if (hit) {
      ordered.push(hit);
      byLabel.delete(normKey(name));
    }
  }
  for (const rest of byLabel.values()) ordered.push(rest);
  return ordered;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smooth RGB along positioned FADE_STOPS for t in [0,1] */
function fadeRgb(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < FADE_STOPS.length - 2 && FADE_STOPS[i + 1].t < clamped) i += 1;
  const a = FADE_STOPS[i];
  const b = FADE_STOPS[i + 1];
  const span = Math.max(1e-6, b.t - a.t);
  const local = (clamped - a.t) / span;
  return [
    Math.round(lerp(a.c[0], b.c[0], local)),
    Math.round(lerp(a.c[1], b.c[1], local)),
    Math.round(lerp(a.c[2], b.c[2], local)),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Lee County p.6 score bar:
 * 1) full-width red→yellow→green fade background
 * 2) gray translucent “striper” overlay (vertically inset) from 0 → score%
 * 3) score number at the right end of that overlay (including 0)
 */
function drawScoreGradientBar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  scorePct: number,
) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(scorePct) || 0)));
  const slices = Math.max(80, Math.ceil(w * 2));
  const sliceW = w / slices;

  // 1) Full fade background (bright track top+bottom stay visible beside the striper)
  for (let i = 0; i < slices; i++) {
    const t = slices === 1 ? 0 : i / (slices - 1);
    doc.rect(x + i * sliceW, y, sliceW + 0.4, h).fill(rgbToHex(fadeRgb(t)));
  }

  const insetY = Math.max(1.6, h * 0.22);
  const overlayH = Math.max(3, h - insetY * 2);
  // Zero still gets a small striper pill so "0" stays readable on the red end
  const fillW = pct > 0 ? Math.max(16, (pct / 100) * w) : 18;

  // 2) Gray striper (including a short pill when score is 0)
  doc.save();
  doc.fillOpacity(0.58);
  doc.rect(x, y + insetY, fillW, overlayH).fill('#808080');
  doc.restore();
  doc.fillOpacity(1);

  // 3) Always show score (including 0) inside the striper pill
  const labelW = Math.min(28, Math.max(12, fillW - 2));
  const labelX = x + Math.max(1, fillW - labelW - 1);
  const fontSize = Math.min(11, Math.max(8, overlayH * 0.9));
  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(fontSize)
    .text(String(pct), labelX, y + insetY + Math.max(0, (overlayH - fontSize) / 2 - 0.5), {
      width: labelW,
      align: pct === 0 ? 'center' : 'right',
      lineBreak: false,
    });
}

/**
 * Single-page Initial Scorecard PDF — matches Quality of Life mockup:
 * gold rule, title, gauge (0–100), 12 modules (icon + gradient bar + title + italic blurb).
 * Top & Lowest Performing remains a separate admin PDF (buildTopLowPerformingPdf).
 */
export function buildInitialScorecardPdf(data: InitialScorecardPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 36,
      info: {
        Title: `Initial Scorecard — ${data.projectName}`,
        Author: 'Rose Associates',
        Subject: 'Prosperity Builder Scorecard — Quality of Life',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const contentWidth = right - left;
    let y = doc.page.margins.top;

    const cats = sortCategories(
      [...(data.categoryScores || [])].map((c) => ({
        ...c,
        scoreTenScale: Number(c.scoreTenScale) || 0,
        scorePercentage: Number(c.scorePercentage) || 0,
        categoryLabel: String(c.categoryLabel || c.categoryKey || 'Category'),
      })),
    );

    const overallPct =
      data.overallScorePercentage != null && Number.isFinite(Number(data.overallScorePercentage))
        ? Math.max(0, Math.min(100, Math.round(Number(data.overallScorePercentage))))
        : toPct(data.overallScoreTenScale);

    // Gold accent rule (mockup)
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .lineWidth(1.25)
      .strokeColor(GOLD)
      .stroke();
    y += 12;

    // Title — sans-serif, single headline
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Prosperity Builder Scorecard®: Quality of Life', left, y, {
        width: contentWidth,
        align: 'center',
        lineBreak: false,
      });
    y += 26;

    const drawIcon = (label: string, x: number, cy: number, size = 28) => {
      const iconPath = resolveCategoryIconPath(label);
      if (iconPath) {
        try {
          doc.image(iconPath, x, cy - size / 2, { width: size, height: size });
          return;
        } catch {
          /* fall through */
        }
      }
      doc.circle(x + size / 2, cy, size / 2).fill(ICON_BG);
      const initial = (label.trim()[0] || '?').toUpperCase();
      doc
        .fillColor('#4B5563')
        .font('Helvetica-Bold')
        .fontSize(size * 0.45)
        .text(initial, x, cy - size * 0.22, { width: size, align: 'center' });
    };

    /** Semi-circle gauge 0–100 with smooth fade (not hard color blocks). */
    const drawGauge = (cx: number, cy: number, radius: number, scorePct: number) => {
      const inner = radius * 0.58;
      const wedges = 90; // fine slices → soft fade along the arc

      for (let i = 0; i < wedges; i++) {
        const t0 = i / wedges;
        const t1 = (i + 1) / wedges;
        const a0 = Math.PI - t0 * Math.PI;
        const a1 = Math.PI - t1 * Math.PI;
        const midT = (t0 + t1) / 2;
        doc.save();
        doc.moveTo(cx, cy);
        doc.lineTo(cx + Math.cos(a0) * radius, cy - Math.sin(a0) * radius);
        doc.lineTo(cx + Math.cos(a1) * radius, cy - Math.sin(a1) * radius);
        doc.closePath().fill(rgbToHex(fadeRgb(midT)));
        doc.restore();
      }

      // Inner white cutout → ring
      doc.circle(cx, cy, inner).fill('#FFFFFF');

      // Soft outer/inner edge
      doc
        .save()
        .moveTo(cx - radius, cy)
        .lineTo(cx + radius, cy)
        .strokeColor('#FFFFFF')
        .lineWidth(1)
        .stroke()
        .restore();

      // Labels sit clearly outside the arc (gap so they never overlap the gauge)
      const labels: Array<{ t: number; label: string; align: 'left' | 'center' | 'right' }> = [
        { t: 0.05, label: 'Poor', align: 'right' },
        { t: 0.32, label: 'Average', align: 'center' },
        { t: 0.68, label: 'Good', align: 'center' },
        { t: 0.95, label: 'Excellent', align: 'left' },
      ];
      labels.forEach(({ t, label, align }) => {
        const a = Math.PI - t * Math.PI;
        const rim = radius + 16;
        const lx = cx + Math.cos(a) * rim;
        const ly = cy - Math.sin(a) * rim;
        const boxW = label === 'Excellent' ? 58 : 54;
        const textX =
          align === 'right' ? lx - boxW + 2 : align === 'left' ? lx - 2 : lx - boxW / 2;
        doc
          .fillColor('#4B5563')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(label, textX, ly - 5, { width: boxW, align, lineBreak: false });
      });

      const needleAngle = Math.PI - (Math.max(0, Math.min(100, scorePct)) / 100) * Math.PI;
      const tipR = radius * 0.9;
      doc
        .moveTo(cx, cy)
        .lineTo(cx + Math.cos(needleAngle) * tipR, cy - Math.sin(needleAngle) * tipR)
        .strokeColor('#4B5563')
        .lineWidth(2)
        .stroke();
      doc.circle(cx, cy, 5).fill('#4B5563');
      doc.circle(cx, cy, 1.8).fill('#FFFFFF');

      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(42)
        .text(String(scorePct), cx - 48, cy + 8, { width: 96, align: 'center', lineBreak: false });
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(String(data.jurisdictionLabel || data.projectName || ''), cx - 160, cy + 52, {
          width: 320,
          align: 'center',
          ellipsis: true,
          lineBreak: false,
          height: 14,
        });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Overall Score', cx - 60, cy + 70, { width: 120, align: 'center', lineBreak: false });
    };

    const gaugeRadius = 98;
    // Extra headroom so Average/Good labels clear the title (labels sit at radius+16)
    const gaugeCy = y + gaugeRadius + 12;
    drawGauge(left + contentWidth / 2, gaugeCy, gaugeRadius, overallPct);
    // Gap after "Overall Score" (drawn at cy+70), then stretch category rows to fill page bottom
    y = gaugeCy + 70 + 28;

    // Category grid — mockup module: icon | Score: [gradient bar] / title / italic blurb
    const colGap = 24;
    const colW = (contentWidth - colGap) / 2;
    const iconSize = 30;
    const mid = Math.ceil(cats.length / 2);
    const leftCats = cats.slice(0, mid);
    const rightCats = cats.slice(mid);
    const rows = Math.max(leftCats.length, rightCats.length, 1);
    const bottomLimit = pageHeight - 40;
    const rowH = Math.max(56, Math.floor((bottomLimit - y) / rows));

    const drawCatRow = (c: (typeof cats)[0], x: number, rowY: number) => {
      const pct = toPct(c.scoreTenScale, c.scorePercentage);
      const iconCy = rowY + 10;
      drawIcon(c.categoryLabel, x, iconCy, iconSize);

      const barX = x + iconSize + 8;
      const barW = colW - iconSize - 8;
      const barH = 17;

      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(10)
        .text('Score:', barX, rowY, { lineBreak: false, width: 40 });

      drawScoreGradientBar(doc, barX + 42, rowY + 1, Math.max(40, barW - 42), barH, pct);

      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(c.categoryLabel, barX, rowY + 22, {
          width: barW,
          ellipsis: true,
          lineBreak: false,
          height: 13,
        });
      doc
        .fillColor(MUTED)
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .text(categoryBlurb(c.categoryLabel), barX, rowY + 36, {
          width: barW,
          height: 18,
          ellipsis: true,
        });
    };

    for (let i = 0; i < rows; i++) {
      if (leftCats[i]) drawCatRow(leftCats[i], left, y);
      if (rightCats[i]) drawCatRow(rightCats[i], left + colW + colGap, y);
      y += rowH;
    }

    // Centered page number (mockup)
    const prevBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fontSize(9)
      .fillColor(MUTED)
      .font('Helvetica')
      .text('1', left, pageHeight - 28, {
        width: contentWidth,
        align: 'center',
        lineBreak: false,
      });
    doc.page.margins.bottom = prevBottom;

    doc.end();
  });
}

const TOP_COLORS = ['#14532D', '#15803D', '#16A34A', '#22C55E', '#4ADE80'];
const LOW_COLORS = ['#7F1D1D', '#991B1B', '#DC2626', '#EF4444', '#FCA5A5'];
const RULE = '#E2E8F0';

/**
 * Single-page PDF: Top 5 + Lowest 5 polar charts only (admin download).
 */
export function buildTopLowPerformingPdf(data: InitialScorecardPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 48,
      info: {
        Title: `Top & Lowest Performing — ${data.projectName}`,
        Author: 'Rose Associates',
        Subject: 'Prosperity Builder Scorecard — Module Performance',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const contentWidth = right - left;
    let y = doc.page.margins.top;

    const cats = [...(data.categoryScores || [])].map((c) => ({
      ...c,
      scoreTenScale: Number(c.scoreTenScale) || 0,
      categoryLabel: String(c.categoryLabel || c.categoryKey || 'Category'),
    }));
    const top5 = [...cats].sort((a, b) => b.scoreTenScale - a.scoreTenScale).slice(0, 5);
    const low5 = [...cats].sort((a, b) => a.scoreTenScale - b.scoreTenScale).slice(0, 5);

    const drawFooter = () => {
      const prevBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .font('Helvetica')
        .text(
          'Rose Associates Southeast, Inc.  ·  Top & Lowest Performing Modules',
          left,
          pageHeight - 28,
          { width: contentWidth, align: 'center', lineBreak: false },
        );
      doc.page.margins.bottom = prevBottom;
    };

    const drawPolarChart = (
      items: typeof cats,
      colors: string[],
      cx: number,
      cy: number,
      maxR: number,
    ) => {
      const n = items.length;
      if (!n) {
        doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('No scores yet.', cx - 40, cy, {
          width: 80,
          align: 'center',
        });
        return;
      }
      const sweep = (Math.PI * 2) / n;
      const start = -Math.PI / 2;
      const gap = 0.04;
      const minR = maxR * 0.42;
      const scores = items.map((it) => Math.max(0, Number(it.scoreTenScale) || 0));
      const peak = Math.max(...scores, 0.1);
      doc.circle(cx, cy, maxR).lineWidth(1).strokeColor('#E2E8F0').stroke();
      const wedges = items.map((item, i) => {
        const a0 = start + i * sweep + gap / 2;
        const a1 = start + (i + 1) * sweep - gap / 2;
        const t = scores[i] / peak;
        const r = minR + t * (maxR - minR);
        return { item, i, a0, a1, r };
      });
      wedges.forEach(({ i, a0, a1, r }) => {
        doc.moveTo(cx, cy);
        for (let s = 0; s <= 32; s++) {
          const a = a0 + ((a1 - a0) * s) / 32;
          doc.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        doc.closePath();
        doc.fillColor(colors[i % colors.length]).fill();
      });
      const holeR = maxR * 0.2;
      doc.circle(cx, cy, holeR).fill('#FFFFFF');
      doc.circle(cx, cy, holeR).lineWidth(1).strokeColor('#F1F5F9').stroke();
      const labelFloor = maxR * 0.55;
      wedges.forEach(({ item, i, a0, a1, r }) => {
        const midA = (a0 + a1) / 2;
        const labelR = Math.max(labelFloor * 0.85, Math.min(r * 0.68, r - 8));
        const lx = cx + Math.cos(midA) * labelR;
        const ly = cy + Math.sin(midA) * labelR;
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(String(i + 1).padStart(2, '0'), lx - 16, ly - 9, {
            width: 32,
            align: 'center',
            lineBreak: false,
          });
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica')
          .fontSize(6)
          .text(shortLabel(item.categoryLabel, 10), lx - 26, ly + 2, {
            width: 52,
            align: 'center',
            lineBreak: false,
          });
      });
    };

    const logoPath = resolveLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, left, y, { height: 32 });
      } catch {
        /* ignore */
      }
    }
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('TOP & LOWEST PERFORMING', left, y + 6, {
        width: contentWidth,
        align: 'right',
        lineBreak: false,
      });
    y += 44;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(RULE).lineWidth(1).stroke();
    y += 14;

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('Module Performance', left, y, { width: contentWidth, align: 'center', lineBreak: false });
    y += 20;
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(
        [data.projectName, data.jurisdictionLabel, data.year ? `Year ${data.year}` : null]
          .filter(Boolean)
          .join('  ·  '),
        left,
        y,
        { width: contentWidth, align: 'center', lineBreak: false },
      );
    y += 24;

    const colGap = 16;
    const halfW = (contentWidth - colGap) / 2;
    const chartR = 82;
    const cardH = 430;

    const drawPolarCard = (
      title: string,
      subtitle: string,
      items: typeof cats,
      colors: string[],
      x: number,
      cardY: number,
    ) => {
      doc.roundedRect(x, cardY, halfW, cardH, 12).fillAndStroke('#F8FAFC', RULE);
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(title, x + 16, cardY + 14, { width: halfW - 32, lineBreak: false });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(subtitle, x + 16, cardY + 30, { width: halfW - 32, lineBreak: false });
      const cx = x + halfW / 2;
      const cy = cardY + 44 + chartR;
      drawPolarChart(items, colors, cx, cy, chartR);
      let ly = cy + chartR + 16;
      items.forEach((item, i) => {
        doc.roundedRect(x + 16, ly + 2, 8, 8, 2).fill(colors[i % colors.length]);
        doc
          .fillColor(INK)
          .font('Helvetica')
          .fontSize(7.5)
          .text(
            `${String(i + 1).padStart(2, '0')}  ${shortLabel(item.categoryLabel, 22)}`,
            x + 28,
            ly,
            { width: halfW - 70, ellipsis: true, lineBreak: false, height: 10 },
          );
        doc
          .fillColor(colors[i % colors.length])
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(item.scoreTenScale.toFixed(1), x + halfW - 40, ly, {
            width: 24,
            align: 'right',
            lineBreak: false,
          });
        ly += 13;
      });
    };

    drawPolarCard('Top Performing Modules', 'Highest scoring sections', top5, TOP_COLORS, left, y);
    drawPolarCard(
      'Lowest Performing Modules',
      'Lowest scoring sections',
      low5,
      LOW_COLORS,
      left + halfW + colGap,
      y,
    );
    drawFooter();
    doc.end();
  });
}
