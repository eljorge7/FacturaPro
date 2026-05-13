export declare class PdfService {
    private getFont;
    private getFontBold;
    private drawTemplateHeader;
    private drawTableAndTotals;
    private drawFooter;
    generateInvoicePdf(invoice: any): Promise<Buffer>;
    generateQuotePdf(quote: any): Promise<Buffer>;
}
