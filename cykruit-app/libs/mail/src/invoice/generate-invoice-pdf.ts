// libs/mail/src/invoice/generate-invoice-pdf.ts
import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: Date;
  companyName: string;
  companyLocation: string;
  packageName: string;
  billingCycle: string;
  currency: string;
  baseAmountPaise: number;
  discountAmountPaise: number;
  gstAmountPaise: number;
  totalAmountPaise: number;
  razorpayPaymentId: string;
}

const BRAND_PRIMARY = '#1B3C8B';
const INK = '#1a202c';
const MUTED = '#718096';
const BORDER = '#e2e8f0';

function money(paise: number, currency: string): string {
  const amount = (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === 'INR' ? `Rs. ${amount}` : `${currency} ${amount}`;
}

/** Renders a single-page subscription invoice as a PDF buffer. */
export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fillColor(BRAND_PRIMARY).fontSize(20).font('Helvetica-Bold').text('Cykruit', 50, 50);
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('Cybersecurity Careers & Talent Platform', 50, 74);

    doc.fillColor(INK).fontSize(16).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text(`Invoice #: ${data.invoiceNumber}`, 350, 74, { width: 195, align: 'right' })
      .text(`Date: ${data.invoiceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 350, 88, { width: 195, align: 'right' });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor(BORDER).stroke();

    // Bill To
    doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, 135);
    doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text(data.companyName, 50, 150);
    doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(data.companyLocation, 50, 167);

    // Line items table
    const tableTop = 220;
    doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 50, tableTop);
    doc.text('AMOUNT', 400, tableTop, { width: 145, align: 'right' });
    doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor(BORDER).stroke();

    let y = tableTop + 28;
    doc.fillColor(INK).fontSize(10).font('Helvetica');
    doc.text(`${data.packageName} Plan (${data.billingCycle})`, 50, y, { width: 320 });
    doc.text(money(data.baseAmountPaise, data.currency), 400, y, { width: 145, align: 'right' });

    if (data.discountAmountPaise > 0) {
      y += 22;
      doc.fillColor(MUTED).text('Discount', 50, y, { width: 320 });
      doc.text(`- ${money(data.discountAmountPaise, data.currency)}`, 400, y, { width: 145, align: 'right' });
    }

    y += 22;
    doc.fillColor(MUTED).text('GST (18%)', 50, y, { width: 320 });
    doc.text(money(data.gstAmountPaise, data.currency), 400, y, { width: 145, align: 'right' });

    y += 20;
    doc.moveTo(350, y).lineTo(545, y).strokeColor(BORDER).stroke();

    y += 12;
    doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text('Total Paid', 350, y, { width: 100 });
    doc.text(money(data.totalAmountPaise, data.currency), 400, y, { width: 145, align: 'right' });

    // Payment reference
    y += 40;
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(`Payment reference: ${data.razorpayPaymentId}`, 50, y);

    // Footer
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
      .text('This is a system-generated invoice and does not require a signature.', 50, 750, { width: 495, align: 'center' })
      .text('Cykruit Inc. · support@cykruit.com', 50, 762, { width: 495, align: 'center' });

    doc.end();
  });
}
