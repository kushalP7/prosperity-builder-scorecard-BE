import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');

export type ReceiptPdfData = {
  orderNumber: string;
  paidAt: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  method: string;
  reference: string;
  status: string;
  amountPaid: number;
};

const BRAND_RED = '#B5111B';
const INK = '#111827';
const MUTED = '#64748B';
const RULE = '#E2E8F0';

function money(n: number): string {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function resolveLogoPath(): string | null {
  const local = path.resolve(process.cwd(), 'assets', 'logo.png');
  return fs.existsSync(local) ? local : null;
}

/** Production letter payment receipt with Rose logo. */
export function buildReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 54,
      info: {
        Title: `Receipt ${data.orderNumber}`,
        Author: 'Rose Associates',
        Subject: `Payment receipt for ${data.packageName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    let y = doc.page.margins.top;

    const logoPath = resolveLogoPath();
    const logoH = 42;
    if (logoPath) {
      try {
        doc.image(logoPath, left, y, { height: logoH });
      } catch {
        doc.fillColor(BRAND_RED).font('Helvetica-Bold').fontSize(16).text('ROSE ASSOCIATES', left, y + 8);
      }
    } else {
      doc.fillColor(BRAND_RED).font('Helvetica-Bold').fontSize(16).text('ROSE ASSOCIATES', left, y + 8);
    }

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('RECEIPT', left, y, { width: contentWidth, align: 'right' });
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('Prosperity Builder Scorecard®', left, y + 26, { width: contentWidth, align: 'right' });

    y += Math.max(logoH, 48) + 14;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(2.5).strokeColor(BRAND_RED).stroke();
    y += 22;

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text('Payment confirmation — keep for your records.', left, y, { width: contentWidth });
    y += 28;

    const rows: Array<[string, string, boolean?]> = [
      ['Date', data.paidAt],
      ['Order', data.orderNumber],
      ['Package', data.packageName],
      ['Payment method', data.method],
      ['Reference', data.reference],
      ['Status', data.status],
      ['Customer', data.customerName],
      ['Email', data.customerEmail],
      ['Amount paid', money(data.amountPaid), true],
    ];

    for (const [label, value, emphasize] of rows) {
      doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor(RULE).stroke();
      y += 10;
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(label, left, y, { width: contentWidth * 0.38 });
      doc
        .fillColor(emphasize ? BRAND_RED : INK)
        .font(emphasize ? 'Helvetica-Bold' : 'Helvetica-Bold')
        .fontSize(emphasize ? 13 : 10)
        .text(value || '—', left + contentWidth * 0.4, y, {
          width: contentWidth * 0.6,
          align: 'right',
        });
      y += emphasize ? 26 : 20;
    }
    doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor(RULE).stroke();
    y += 28;

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('Thank you for your payment.', left, y, { width: contentWidth, align: 'center' });
    doc
      .fontSize(8)
      .text('Rose Associates  ·  info@roseassociates.com', left, y + 16, {
        width: contentWidth,
        align: 'center',
      });

    doc.end();
  });
}
