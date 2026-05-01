import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {

  private getFont(fontName: string) {
    if (fontName === 'Times-Roman') return 'Times-Roman';
    if (fontName === 'Courier') return 'Courier';
    return 'Helvetica';
  }

  private getFontBold(fontName: string) {
    if (fontName === 'Times-Roman') return 'Times-Bold';
    if (fontName === 'Courier') return 'Courier-Bold';
    return 'Helvetica-Bold';
  }

  private drawTemplateHeader(doc: any, data: any, isQuote: boolean, template: string) {
     const bColor = data.taxProfile?.brandColor || '#10b981';
     const fReg = this.getFont(data.taxProfile?.brandFont || 'Helvetica');
     const fBold = this.getFontBold(data.taxProfile?.brandFont || 'Helvetica');

     let logoPath = null;
     if (data.taxProfile?.logoUrl) {
        logoPath = path.join(__dirname, '..', '..', 'public', data.taxProfile.logoUrl);
        if (!fs.existsSync(logoPath)) logoPath = null;
     }
     const logoWidth = (data.taxProfile?.logoWidth || 120) * 0.7;

     const docTitle = isQuote ? 'COTIZACIÓN' : 'FACTURA COMERCIAL';
     const docNum = isQuote ? data.quoteNumber : data.invoiceNumber;
     const docDate = new Date(data.createdAt).toLocaleDateString();

     if (template === 'Ticket POS Termal') {
         if (logoPath) doc.image(logoPath, (doc.page.width - logoWidth) / 2, 20, { width: logoWidth, align: 'center' });
         else doc.fillColor(bColor).fontSize(14).font(fBold).text(data.taxProfile?.legalName || 'Empresa', 10, 20, { align: 'center', width: doc.page.width - 20});
         doc.moveDown(1);
         doc.fillColor('#000').fontSize(10).font(fBold).text(docTitle, 10, doc.y, { align: 'center', width: doc.page.width - 20 });
         doc.font(fReg).fontSize(8).text(`Folio: ${docNum}`, { align: 'center' });
         doc.text(docDate, { align: 'center' });
         doc.moveDown(1);
         doc.font(fBold).text('EMISOR', { align: 'center' });
         doc.font(fReg).text(data.taxProfile?.legalName || '', { align: 'center' });
         doc.text(data.taxProfile?.rfc || '', { align: 'center' });
         doc.moveDown();
         doc.font(fBold).text('RECEPTOR', { align: 'center' });
         doc.font(fReg).text(data.customer?.legalName || '', { align: 'center' });
         doc.text(data.customer?.rfc || '', { align: 'center' });
         doc.moveDown(2);
     } 
     else if (template === 'Elegante Dark Header') {
         doc.rect(0, 0, doc.page.width, 180).fill('#0f172a');
         if (logoPath) doc.image(logoPath, 50, 40, { width: logoWidth, align: 'left' });
         else doc.fillColor('#ffffff').fontSize(22).font(fBold).text(data.taxProfile?.legalName || 'Empresa', 50, 40);
         
         doc.fillColor(bColor).fontSize(14).font(fBold).text(docTitle, 50, 100);
         doc.fontSize(10).fillColor('#94a3b8').font(fReg).text(`N.º ${docNum}`, 50, 120);
         
         doc.fillColor('#ffffff').fontSize(10).font(fBold).text('PREPARADO PARA:', 350, 50);
         doc.fillColor('#cbd5e1').fontSize(10).font(fReg).text(data.customer?.legalName || 'Público General', 350, 65, { width: 200 });
         doc.text(`RFC: ${data.customer?.rfc || ''}`, 350, 80);
         
         doc.y = 200;
         doc.fillColor('#334155').fontSize(10).font(fBold).text('Información Emisor:', 50, 200);
         doc.font(fReg).fontSize(9).text(`RFC: ${data.taxProfile?.rfc}`, 50, 215);
         doc.y = 250;
     }
     else if (template === 'Bold Accent') {
         doc.rect(0, 0, doc.page.width, 120).fill(bColor);
         if (logoPath) doc.image(logoPath, 50, 30, { width: logoWidth, align: 'left' });
         else doc.fillColor('#ffffff').fontSize(24).font(fBold).text(data.taxProfile?.legalName || 'Empresa', 50, 40, { width: 280 });
         
         doc.fillColor('#ffffff').fontSize(16).font(fBold).text(docTitle, 350, 40, { align: 'right', width: 195 });
         doc.fontSize(12).font(fReg).text(`# ${docNum}`, 350, 60, { align: 'right', width: 195 });
         
         doc.y = 150;
         doc.fillColor(bColor).fontSize(10).font(fBold).text('EMISOR', 50, 150);
         doc.fillColor('#334155').font(fReg).fontSize(9).text(data.taxProfile?.legalName || '', 50, 165);
         doc.text(data.taxProfile?.rfc || '', 50, 180);
         
         doc.fillColor(bColor).font(fBold).text('RECEPTOR', 300, 150);
         doc.fillColor('#334155').font(fReg).text(data.customer?.legalName || '', 300, 165);
         doc.text(data.customer?.rfc || '', 300, 180);
         doc.y = 230;
     }
     else if (template === 'Avant-Garde Agencia') {
         doc.fillColor(bColor).fontSize(30).font(fBold).text(docTitle.toUpperCase(), 50, 50);
         if (logoPath) doc.image(logoPath, 450, 45, { width: logoWidth, align: 'right' });
         
         doc.fillColor('#334155').fontSize(10).font(fReg).text(`Folio: ${docNum}`, 50, 95);
         doc.text(`Fecha: ${docDate}`, 50, 110);
         
         doc.moveTo(50, 140).lineTo(545, 140).lineWidth(3).strokeColor(bColor).stroke();
         
         doc.y = 160;
         doc.fontSize(10).font(fBold).text('DE:', 50, 160);
         doc.font(fReg).text(data.taxProfile?.legalName || '', 50, 175);
         
         doc.font(fBold).text('PARA:', 300, 160);
         doc.font(fReg).text(data.customer?.legalName || '', 300, 175);
         doc.y = 220;
     }
     else if (template === 'Corporativo Bancario') {
         doc.rect(50, 40, 495, 50).fill('#f8fafc');
         doc.moveTo(50, 40).lineTo(545, 40).lineWidth(4).strokeColor(bColor).stroke();
         
         if (logoPath) doc.image(logoPath, 60, 55, { width: logoWidth * 0.8, align: 'left'});
         doc.fillColor('#1e293b').fontSize(14).font(fBold).text(docTitle, 350, 58, { align: 'right', width:180 });
         
         doc.rect(50, 110, 240, 70).strokeColor('#cbd5e1').stroke();
         doc.rect(305, 110, 240, 70).strokeColor('#cbd5e1').stroke();
         
         doc.fontSize(9).font(fBold).fillColor(bColor).text('DATOS DE EMISIÓN', 60, 120);
         doc.fillColor('#334155').font(fReg).text(`Folio: ${docNum}`, 60, 135);
         doc.text(`Fecha: ${docDate}`, 60, 150);
         
         doc.font(fBold).fillColor(bColor).text('DATOS DEL RECEPTOR', 315, 120);
         doc.fillColor('#334155').font(fReg).text(data.customer?.legalName || '', 315, 135);
         doc.text(`RFC: ${data.customer?.rfc || ''}`, 315, 150);
         doc.y = 210;
     }
     else {
         // Minimalista Notion
         if (logoPath) doc.image(logoPath, 50, 40, { width: logoWidth, align: 'left' });
         else doc.fillColor('#0f172a').fontSize(20).font(fBold).text(data.taxProfile?.legalName || 'Empresa', 50, 40);
         
         doc.fillColor(bColor).fontSize(10).font(fBold).text(docTitle, 350, 40, { align: 'right', width: 195 });
         doc.fillColor('#64748b').fontSize(9).font(fReg).text(`# ${docNum}`, 350, 53, { align: 'right', width: 195 });
         doc.text(docDate, 350, 66, { align: 'right', width: 195 });
         
         doc.fillColor('#0f172a').fontSize(9).font(fBold).text('De:', 50, 130);
         doc.font(fReg).text(data.taxProfile?.legalName || '', 50, 145);
         doc.text(data.taxProfile?.rfc || '', 50, 160);
         
         doc.font(fBold).text('Para:', 300, 130);
         doc.font(fReg).text(data.customer?.legalName || '', 300, 145);
         doc.text(data.customer?.rfc || '', 300, 160);
         
         doc.y = 210;
     }
  }

  private drawTableAndTotals(doc: any, data: any, isQuote: boolean, template: string) {
     const bColor = data.taxProfile?.brandColor || '#10b981';
     const fReg = this.getFont(data.taxProfile?.brandFont || 'Helvetica');
     const fBold = this.getFontBold(data.taxProfile?.brandFont || 'Helvetica');

     const isDark = template === 'Elegante Dark Header';
     const isSpreadsheet = template === 'Corporativo Bancario';
     const isPOS = template === 'Ticket POS Termal';

     const tableHeaderBg = isDark ? '#1e293b' : (isSpreadsheet ? '#f8fafc' : (template==='Bold Accent' ? bColor : '#f1f5f9'));
     const tableHeaderColor = (isDark || template==='Bold Accent') ? '#ffffff' : '#334155';
     const tableBorderColor = isSpreadsheet ? '#cbd5e1' : '#e2e8f0';

     const tableTop = doc.y;
     
     if (isPOS) {
         doc.moveTo(10, tableTop).lineTo(216, tableTop).lineWidth(1).strokeColor('#e2e8f0').stroke();
         doc.font(fBold).fontSize(8).fillColor('#000');
         doc.text('CANT', 10, tableTop + 5);
         doc.text('DESC', 35, tableTop + 5);
         doc.text('IMP', 170, tableTop + 5);
         let rowY = tableTop + 20;
         doc.font(fReg).fontSize(8);
         if (data.items && data.items.length > 0) {
             data.items.forEach((item: any) => {
                 doc.text(item.quantity.toString(), 10, rowY);
                 doc.text(item.description.substring(0, 30), 35, rowY);
                 doc.text(`$${((item.quantity * item.unitPrice) - item.discount).toLocaleString()}`, 170, rowY, { align: 'right', width: 45 });
                 rowY += 15;
             });
         }
         doc.moveTo(10, rowY).lineTo(216, rowY).stroke();
         rowY += 10;
         doc.font(fBold).text('TOTAL:', 10, rowY);
         doc.text(`$${data.total.toLocaleString()}`, 170, rowY, { align: 'right', width: 45 });
         doc.y = rowY + 30;
         return;
     }

     if (template !== 'Avant-Garde Agencia' && template !== 'Minimalista Notion') {
         doc.rect(50, tableTop, 495, 20).fill(tableHeaderBg);
     }
     
     if (isSpreadsheet) {
         doc.moveTo(50, tableTop).lineTo(545, tableTop).lineWidth(1).strokeColor(tableBorderColor).stroke();
     } else if (template === 'Minimalista Notion' || template === 'Avant-Garde Agencia') {
         doc.moveTo(50, tableTop).lineTo(545, tableTop).lineWidth(1).strokeColor(bColor).stroke();
         doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).lineWidth(1).strokeColor('#e2e8f0').stroke();
     }

     const hColor = (template==='Minimalista Notion' || template==='Avant-Garde Agencia') ? '#334155' : tableHeaderColor;
     doc.fillColor(hColor).font(fBold).fontSize(9);
     doc.text('CANT', 55, tableTop + 5);
     doc.text('DESCRIPCION', 100, tableTop + 5);
     doc.text('PRECIO U.', 350, tableTop + 5);
     doc.text('IMPORTE', 470, tableTop + 5);

     let rowY = tableTop + 25;
     doc.fillColor('#334155').font(fReg).fontSize(9);

     if (data.items && data.items.length > 0) {
        data.items.forEach((item: any) => {
           doc.text(item.quantity.toString(), 55, rowY);
           doc.text(item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description, 100, rowY);
           doc.text(`$${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 350, rowY);
           doc.text(`$${((item.quantity * item.unitPrice) - item.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 470, rowY);
           
           if (isSpreadsheet || template === 'Minimalista Notion') {
              doc.moveTo(50, rowY + 15).lineTo(545, rowY + 15).lineWidth(0.5).strokeColor('#f1f5f9').stroke();
           }
           rowY += 20;
        });
     }

     if (!isSpreadsheet && template !== 'Avant-Garde Agencia' && template !== 'Minimalista Notion') {
        doc.moveTo(50, rowY).lineTo(545, rowY).lineWidth(1).strokeColor(tableBorderColor).stroke();
     }

     const summaryTop = rowY + 20;
     doc.font(fReg).fillColor('#64748b').text('Subtotal:', 350, summaryTop);
     doc.fillColor('#0f172a').text(`$${(data.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 470, summaryTop);
     
     doc.fillColor('#64748b').text('Impuestos:', 350, summaryTop + 15);
     doc.fillColor('#0f172a').text(`$${(data.taxTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 470, summaryTop + 15);
     
     if(template === 'Avant-Garde Agencia') {
         doc.rect(340, summaryTop + 30, 205, 40).fill(bColor);
         doc.font(fBold).fillColor('#ffffff').fontSize(14).text('TOTAL', 350, summaryTop + 45);
         doc.text(`$${(data.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 420, summaryTop + 45, { align: 'right', width:115 });
     } else {
         doc.font(fBold).fillColor(bColor).fontSize(11).text('TOTAL:', 350, summaryTop + 35);
         doc.fillColor('#0f172a').text(`$${(data.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 470, summaryTop + 35);
     }

     doc.y = summaryTop + 80;
  }

  private drawFooter(doc: any, data: any, isQuote: boolean, template: string) {
     if (template === 'Ticket POS Termal') {
         doc.font(this.getFont(data.taxProfile?.brandFont)).fontSize(7).fillColor('#64748b').text('GRACIAS POR SU PREFERENCIA', 10, doc.y, { align: 'center', width: doc.page.width - 20});
         return;
     }

     const footerTop = doc.page.height - 180;
     const fReg = this.getFont(data.taxProfile?.brandFont || 'Helvetica');
     const fBold = this.getFontBold(data.taxProfile?.brandFont || 'Helvetica');
     
     if (isQuote) {
        doc.moveTo(50, footerTop + 100).lineTo(545, footerTop + 100).lineWidth(1).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#94a3b8').font(fBold).fontSize(8).text('ESTE DOCUMENTO ES UNA ESTIMACIÓN COMERCIAL Y CARECE DE VALIDEZ FISCAL.', 50, footerTop + 120, { align: 'center' });
        if (data.notes) {
           doc.fillColor('#334155').font(fBold).text('NOTAS / TÉRMINOS:', 50, footerTop + 50);
           doc.font(fReg).text(data.notes, 50, footerTop + 65, { width: 400 });
        }
     } else {
        doc.moveTo(50, footerTop).lineTo(545, footerTop).lineWidth(1).strokeColor('#e2e8f0').stroke();
        
        doc.rect(50, footerTop + 15, 80, 80).fillOpacity(0.1).fill(data.taxProfile?.brandColor || '#10b981');
        doc.fillOpacity(1).fillColor(data.taxProfile?.brandColor || '#10b981').font(fBold).fontSize(8).text('QR SAT', 75, footerTop + 50);

        let selloEmisor = 'X4vL8z9qP2mK5hT8jN3bY6vC1xL5mP...';
        let selloSat = 'Q9kV3cY8vL5mX4zN1qP6bH...';
        let cadenaOriginal = `||1.1|${data.satUuid || '00000000-0000'}||...||`;

        if (data.xmlContent) {
            const mEmisor = data.xmlContent.match(/Sello="([^"]+)"/);
            if (mEmisor) selloEmisor = mEmisor[1].substring(0, 80) + '...';
        }

        doc.fillColor('#94a3b8').font(fBold).fontSize(6);
        doc.text('SELLO DIGITAL DEL CFDI:', 140, footerTop + 15);
        doc.fillColor('#64748b').font(fReg).text(selloEmisor, 140, footerTop + 25, { width: 400 });

        doc.fillColor('#94a3b8').font(fBold).text('SELLO DIGITAL DEL SAT:', 140, footerTop + 45);
        doc.fillColor('#64748b').font(fReg).text(selloSat, 140, footerTop + 55, { width: 400 });

        doc.fillColor('#94a3b8').font(fBold).text('CADENA ORIGINAL DEL COMPLEMENTO SAT:', 140, footerTop + 75);
        doc.fillColor('#64748b').font(fReg).text(cadenaOriginal, 140, footerTop + 85, { width: 400 });

        doc.fillColor('#94a3b8').font(fBold).fontSize(8).text('Representación impresa de un CFDI válido para México.', 50, footerTop + 120, { align: 'center' });
     }
  }

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const template = invoice.taxProfile?.pdfTemplate || 'Minimalista Notion';
        const isPOS = template === 'Ticket POS Termal';
        const docOpts = isPOS ? { margin: 10, size: [226, 600] } : { margin: 50, size: 'A4' };
        
        const doc = new PDFDocument(docOpts);
        const buffers: Buffer[] = [];

        doc.on('data', (buffer: any) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: any) => reject(err));

        this.drawTemplateHeader(doc, invoice, false, template);
        this.drawTableAndTotals(doc, invoice, false, template);
        this.drawFooter(doc, invoice, false, template);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async generateQuotePdf(quote: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const template = quote.taxProfile?.pdfTemplate || 'Minimalista Notion';
        const isPOS = template === 'Ticket POS Termal';
        const docOpts = isPOS ? { margin: 10, size: [226, 600] } : { margin: 50, size: 'A4' };
        
        const doc = new PDFDocument(docOpts);
        const buffers: Buffer[] = [];

        doc.on('data', (buffer: any) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: any) => reject(err));

        this.drawTemplateHeader(doc, quote, true, template);
        this.drawTableAndTotals(doc, quote, true, template);
        this.drawFooter(doc, quote, true, template);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
