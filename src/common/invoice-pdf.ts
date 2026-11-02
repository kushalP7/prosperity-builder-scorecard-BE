import * as fs from 'fs';
import * as path from 'path';
// CommonJS-safe import (tsconfig has no esModuleInterop)
import PDFDocument = require('pdfkit');

export type InvoicePdfData = {
  orderNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  organization?: string | null;
  packageName: string;
  amountDue: number;
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

/** Production letter invoice with Rose logo (assets/logo.png) when available. */
export function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 54,
      info: {
        Title: `Invoice ${data.orderNumber}`,
        Author: 'Rose Associates',
        Subject: `Invoice for ${data.packageName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const contentWidth = right - left;
    let y = doc.page.margins.top;

    // —— Header: logo + INVOICE title ——
    const logoPath = resolveLogoPath();
    const logoH = 42;
    if (logoPath) {
      try {
        doc.image(logoPath, left, y, { height: logoH });
      } catch {
        doc
          .fillColor(BRAND_RED)
          .font('Helvetica-Bold')
          .fontSize(16)
          .text('ROSE ASSOCIATES', left, y + 8);
      }
    } else {
      doc
        .fillColor(BRAND_RED)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('ROSE ASSOCIATES', left, y + 8);
    }

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('INVOICE', left, y, { width: contentWidth, align: 'right' });

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('PEOPLE  |  PLACES  |  PROGRESS', left, y + 26, {
        width: contentWidth,
        align: 'right',
      });

    y += Math.max(logoH, 48) + 14;

    // Brand accent rule
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .lineWidth(2.5)
      .strokeColor(BRAND_RED)
      .stroke();
    y += 18;

    // —— Meta + Bill To ——
    const colGap = 24;
    const colW = (contentWidth - colGap) / 2;
    const metaTop = y;

    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text('INVOICE DETAILS', left, metaTop);
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(10)
      .text(`Invoice #:  ${data.orderNumber}`, left, metaTop + 16)
      .text(`Date:  ${data.invoiceDate}`, left, metaTop + 32)
      .text('Payment:  Invoice / mail check', left, metaTop + 48);

    const billLeft = left + colW + colGap;
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text('BILL TO', billLeft, metaTop);
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(data.customerName || 'Customer', billLeft, metaTop + 16, { width: colW });
    let billY = metaTop + 34;
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(INK)
      .text(data.customerEmail || '', billLeft, billY, { width: colW });
    billY += 16;
    if (data.organization?.trim()) {
      doc.fillColor(MUTED).text(data.organization.trim(), billLeft, billY, { width: colW });
      billY += 16;
    }

    y = Math.max(metaTop + 72, billY) + 20;

    // —— Line items table ——
    const rowH = 28;
    const descW = contentWidth * 0.72;
    const amtW = contentWidth - descW;

    // Header row
    doc.rect(left, y, contentWidth, rowH).fill(BRAND_RED);
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Description', left + 12, y + 9, { width: descW - 16 })
      .text('Amount', left + descW, y + 9, { width: amtW - 12, align: 'right' });
    y += rowH;

    // Item row
    doc.rect(left, y, contentWidth, rowH + 8).fill('#F8FAFC');
    doc
      .strokeColor(RULE)
      .lineWidth(1)
      .rect(left, y, contentWidth, rowH + 8)
      .stroke();
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(10)
      .text(data.packageName || 'Package', left + 12, y + 12, { width: descW - 16 })
      .font('Helvetica-Bold')
      .text(money(data.amountDue), left + descW, y + 12, { width: amtW - 12, align: 'right' });
    y += rowH + 8;

    // Total
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text('Total due', left + descW - 80, y + 14, { width: 68, align: 'right' });
    doc
      .fillColor(BRAND_RED)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(money(data.amountDue), left + descW, y + 12, { width: amtW - 12, align: 'right' });
    y += 48;

    // —— Remit box ——
    const boxH = 108;
    doc.roundedRect(left, y, contentWidth, boxH, 6).fillAndStroke('#FFF7F7', '#FECACA');
    doc
      .fillColor(BRAND_RED)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('REMITTANCE', left + 14, y + 12);
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(10)
      .text('Make checks payable to: Rose Associates', left + 14, y + 32)
      .text('Mail to: Rose Associates — Attn: Accounts Receivable', left + 14, y + 48)
      .text('Questions: info@roseassociates.com', left + 14, y + 64)
      .fillColor(MUTED)
      .fontSize(9)
      .text(
        'Package access unlocks after Rose Associates records payment.',
        left + 14,
        y + 82,
        { width: contentWidth - 28 },
      );
    y += boxH + 28;

    // —— Footer ——
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('Thank you for your business.', left, y, { width: contentWidth, align: 'center' });
    doc
      .fontSize(8)
      .text('Rose Associates  ·  Prosperity Builder Scorecard®', left, y + 16, {
        width: contentWidth,
        align: 'center',
      });

    doc.end();
  });
}
