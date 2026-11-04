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
  performanceBand: string;
  categoryScores: InitialScorecardCategory[];
};

const BRAND_RED = '#B5111B';
const INK = '#111827';
const MUTED = '#64748B';
const RULE = '#E2E8F0';
const GREEN = '#15803d';
const AMBER = '#d97706';
const ROSE = '#be123c';
const TRACK = '#E2E8F0';
const ICON_BG = '#E5E7EB';

const GAUGE_POOR = '#DC2626';
const GAUGE_AVG = '#EAB308';
const GAUGE_GOOD = '#86EFAC';
const GAUGE_EXC = '#15803D';

const TOP_COLORS = ['#14532D', '#15803D', '#16A34A', '#22C55E', '#4ADE80'];
const LOW_COLORS = ['#7F1D1D', '#991B1B', '#DC2626', '#EF4444', '#FCA5A5'];

/** Normalized label → icon filename (sans .png) under assets/category-icons */
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
  infrastructure: 'infrastructure',
  'open space & recreation': 'open-space-recreation',
  'planning & land use': 'planning-land-use',
};

function resolveLogoPath(): string | null {
  const local = path.resolve(process.cwd(), 'assets', 'logo.png');
  return fs.existsSync(local) ? local : null;
}

function categoryIconSlug(label: string): string | null {
  const key = String(label || '')
    .trim()
    .toLowerCase();
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

function scoreColor(ten: number): string {
  if (ten >= 7) return GREEN;
  if (ten >= 4) return AMBER;
  return ROSE;
}

function barFill(ten: number): string {
  return scoreColor(ten);
}

function shortLabel(label: string, max = 10): string {
  const s = String(label || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(1, max - 1))}…`;
}

/**
 * 2-page Initial Scorecard PDF:
 * Page 1 — gauge (0–10) + category scores with gray/black icons
 * Page 2 — Top 5 / Lowest 5 polar area charts
 */
export function buildInitialScorecardPdf(data: InitialScorecardPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 48,
      info: {
        Title: `Initial Scorecard — ${data.projectName}`,
        Author: 'Rose Associates',
        Subject: 'Prosperity Builder Scorecard — Initial Report',
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
    const overall = Math.max(0, Math.min(10, Number(data.overallScoreTenScale) || 0));

    const drawIconBadge = (label: string, x: number, cy: number, size = 14) => {
      const r = size / 2;
      doc.circle(x + r, cy, r).fill(ICON_BG);
      const iconPath = resolveCategoryIconPath(label);
      if (iconPath) {
        try {
          const pad = 2.5;
          doc.image(iconPath, x + pad, cy - r + pad, {
            width: size - pad * 2,
            height: size - pad * 2,
          });
          return;
        } catch {
          /* fall through */
        }
      }
      const initial = (label.trim()[0] || '?').toUpperCase();
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(size * 0.55)
        .text(initial, x, cy - size * 0.28, { width: size, align: 'center' });
    };

    /** Footer must not trip PDFKit's bottom-margin auto page-break (was creating blank pages). */
    const drawFooter = (pageLabel: string) => {
      const prevBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const footerY = pageHeight - 28;
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .font('Helvetica')
        .text(
          `Rose Associates Southeast, Inc.  ·  Initial scorecard  ·  ${pageLabel}`,
          left,
          footerY,
          { width: contentWidth, align: 'center', lineBreak: false },
        );
      doc.page.margins.bottom = prevBottom;
    };

    /** Semi-circle gauge: Poor / Average / Good / Excellent, score 0–10 */
    const drawGauge = (cx: number, cy: number, radius: number, score: number) => {
      const inner = radius * 0.62;
      const bands: Array<{ color: string; label: string }> = [
        { color: GAUGE_POOR, label: 'Poor' },
        { color: GAUGE_AVG, label: 'Average' },
        { color: GAUGE_GOOD, label: 'Good' },
        { color: GAUGE_EXC, label: 'Excellent' },
      ];

      // Arc from π (left) to 0 (right), 4 equal quarters
      bands.forEach((band, i) => {
        const a0 = Math.PI - (i * Math.PI) / 4;
        const a1 = Math.PI - ((i + 1) * Math.PI) / 4;
        doc.save();
        doc.moveTo(cx, cy);
        for (let t = 0; t <= 24; t++) {
          const a = a0 + ((a1 - a0) * t) / 24;
          const px = cx + Math.cos(a) * radius;
          const py = cy - Math.sin(a) * radius;
          if (t === 0) doc.lineTo(px, py);
          else doc.lineTo(px, py);
        }
        for (let t = 24; t >= 0; t--) {
          const a = a0 + ((a1 - a0) * t) / 24;
          const px = cx + Math.cos(a) * inner;
          const py = cy - Math.sin(a) * inner;
          doc.lineTo(px, py);
        }
        doc.closePath().fill(band.color);
        doc.restore();

        const mid = (a0 + a1) / 2;
        const lx = cx + Math.cos(mid) * (radius + 14);
        const ly = cy - Math.sin(mid) * (radius + 14);
        doc
          .fillColor(MUTED)
          .font('Helvetica')
          .fontSize(7)
          .text(band.label, lx - 22, ly - 4, { width: 44, align: 'center', lineBreak: false });
      });

      // Needle (score 0 → left/π, 10 → right/0)
      const needleAngle = Math.PI - (score / 10) * Math.PI;
      const tipR = radius * 0.88;
      const tipX = cx + Math.cos(needleAngle) * tipR;
      const tipY = cy - Math.sin(needleAngle) * tipR;
      doc
        .moveTo(cx, cy)
        .lineTo(tipX, tipY)
        .strokeColor(INK)
        .lineWidth(2.5)
        .stroke();
      doc.circle(cx, cy, 6).fill(INK);
      doc.circle(cx, cy, 2.5).fill('#FFFFFF');

      // Dynamic 0–10 score (e.g. 7.4)
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(28)
        .text(score.toFixed(1), cx - 40, cy + 10, { width: 80, align: 'center', lineBreak: false });
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(String(data.jurisdictionLabel || data.projectName || ''), cx - 110, cy + 42, {
          width: 220,
          align: 'center',
          ellipsis: true,
          lineBreak: false,
          height: 12,
        });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text('Overall Score', cx - 50, cy + 56, { width: 100, align: 'center', lineBreak: false });
    };

    /** Polar area chart — equal angles; radius scaled within this chart's scores */
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
      const start = -Math.PI / 2; // 12 o'clock
      const gap = 0.04; // white gap between wedges (radians)
      const minR = maxR * 0.42;
      const scores = items.map((it) => Math.max(0, Number(it.scoreTenScale) || 0));
      const peak = Math.max(...scores, 0.1);

      // Guide ring (behind wedges)
      doc.circle(cx, cy, maxR).lineWidth(1).strokeColor('#E2E8F0').stroke();

      const wedges = items.map((item, i) => {
        const a0 = start + i * sweep + gap / 2;
        const a1 = start + (i + 1) * sweep - gap / 2;
        const t = scores[i] / peak;
        const r = minR + t * (maxR - minR);
        return { item, i, a0, a1, r };
      });

      // Draw filled wedges
      wedges.forEach(({ i, a0, a1, r }) => {
        doc.moveTo(cx, cy);
        const steps = 32;
        for (let s = 0; s <= steps; s++) {
          const a = a0 + ((a1 - a0) * s) / steps;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          doc.lineTo(px, py);
        }
        doc.closePath();
        doc.fillColor(colors[i % colors.length]).fill();
      });

      // Center hole
      const holeR = maxR * 0.2;
      doc.circle(cx, cy, holeR).fill('#FFFFFF');
      doc.circle(cx, cy, holeR).lineWidth(1).strokeColor('#F1F5F9').stroke();

      // Labels at mid-radius of each wedge (never below min label ring)
      const labelFloor = maxR * 0.55;
      wedges.forEach(({ item, i, a0, a1, r }) => {
        const mid = (a0 + a1) / 2;
        const labelR = Math.max(labelFloor * 0.85, Math.min(r * 0.68, r - 8));
        const lx = cx + Math.cos(mid) * labelR;
        const ly = cy + Math.sin(mid) * labelR;
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

    // ========== PAGE 1 ==========
    const logoPath = resolveLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, left, y, { height: 36 });
      } catch {
        doc.fillColor(BRAND_RED).font('Helvetica-Bold').fontSize(14).text('ROSE ASSOCIATES', left, y + 6);
      }
    } else {
      doc.fillColor(BRAND_RED).font('Helvetica-Bold').fontSize(14).text('ROSE ASSOCIATES', left, y + 6);
    }

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('INITIAL SCORECARD REPORT', left, y + 4, { width: contentWidth, align: 'right' });

    y += 48;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(RULE).lineWidth(1).stroke();
    y += 14;

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text('Prosperity Builder Scorecard®', left, y, {
      width: contentWidth,
      align: 'center',
    });
    y = doc.y + 2;
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text(
        [data.projectName, data.jurisdictionLabel, data.year ? `Year ${data.year}` : null]
          .filter(Boolean)
          .join('  ·  '),
        left,
        y,
        { width: contentWidth, align: 'center' },
      );
    y = doc.y + 12;

    // Gauge (compact so page 1 stays single-page with categories + footer)
    const gaugeCy = y + 68;
    drawGauge(left + contentWidth / 2, gaugeCy, 64, overall);
    y = gaugeCy + 72;

    // Category scores
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Category scores', left, y, { lineBreak: false });
    y += 16;

    const colGap = 16;
    const colW = (contentWidth - colGap) / 2;
    const rowH = 28;
    const iconSize = 14;
    const iconGap = 6;
    const mid = Math.ceil(cats.length / 2);
    const leftCats = cats.slice(0, mid);
    const rightCats = cats.slice(mid);

    const drawCatRow = (c: (typeof cats)[0], x: number, rowY: number) => {
      const ten = c.scoreTenScale;
      const textX = x + iconSize + iconGap;
      const textW = colW - iconSize - iconGap - 36;
      drawIconBadge(c.categoryLabel, x, rowY + 5, iconSize);
      doc.fillColor(INK).font('Helvetica').fontSize(8).text(c.categoryLabel, textX, rowY, {
        width: textW,
        ellipsis: true,
        lineBreak: false,
        height: 10,
      });
      doc
        .fillColor(scoreColor(ten))
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(ten.toFixed(1), x + colW - 36, rowY, {
          width: 36,
          align: 'right',
          lineBreak: false,
        });
      const barY = rowY + 13;
      const barW = colW - 4;
      doc.roundedRect(x, barY, barW, 5, 2).fill(TRACK);
      const fillW = Math.max(2, Math.min(barW, (ten / 10) * barW));
      doc.roundedRect(x, barY, fillW, 5, 2).fill(barFill(ten));
    };

    const rows = Math.max(leftCats.length, rightCats.length);
    for (let i = 0; i < rows; i++) {
      if (leftCats[i]) drawCatRow(leftCats[i], left, y);
      if (rightCats[i]) drawCatRow(rightCats[i], left + colW + colGap, y);
      y += rowH;
    }

    drawFooter('Page 1');

    // ========== PAGE 2 — Top / Lowest polar charts ==========
    doc.addPage();
    y = doc.page.margins.top;

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('Module Performance', left, y, {
        width: contentWidth,
        align: 'center',
        lineBreak: false,
      });
    y += 20;
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('Highest and lowest scoring quality-of-life modules', left, y, {
        width: contentWidth,
        align: 'center',
        lineBreak: false,
      });
    y += 22;

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

      // Legend under chart (stays inside card)
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

    drawPolarCard(
      'Top Performing Modules',
      'Highest scoring sections',
      top5,
      TOP_COLORS,
      left,
      y,
    );
    drawPolarCard(
      'Lowest Performing Modules',
      'Lowest scoring sections',
      low5,
      LOW_COLORS,
      left + halfW + colGap,
      y,
    );

    drawFooter('Page 2');

    doc.end();
  });
}

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
        const mid = (a0 + a1) / 2;
        const labelR = Math.max(labelFloor * 0.85, Math.min(r * 0.68, r - 8));
        const lx = cx + Math.cos(mid) * labelR;
        const ly = cy + Math.sin(mid) * labelR;
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
      .text('TOP & LOWEST PERFORMING', left, y + 6, { width: contentWidth, align: 'right', lineBreak: false });
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
