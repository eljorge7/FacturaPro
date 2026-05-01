"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalController = void 0;
const common_1 = require("@nestjs/common");
const invoices_service_1 = require("./invoices.service");
const pdf_service_1 = require("./pdf.service");
let PortalController = class PortalController {
    invoicesService;
    pdfService;
    constructor(invoicesService, pdfService) {
        this.invoicesService = invoicesService;
        this.pdfService = pdfService;
    }
    async getPublicInvoice(id) {
        try {
            const invoice = await this.invoicesService.findOne(id);
            return {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                date: invoice.date,
                status: invoice.status,
                total: invoice.total,
                subtotal: invoice.subtotal,
                taxTotal: invoice.taxTotal,
                currency: invoice.currency,
                satUuid: invoice.satUuid,
                paymentForm: invoice.paymentForm,
                paymentMethod: invoice.paymentMethod,
                cfdiUse: invoice.cfdiUse,
                createdAt: invoice.createdAt,
                customer: {
                    legalName: invoice.customer?.legalName,
                    rfc: invoice.customer?.rfc,
                    zipCode: invoice.customer?.zipCode,
                    email: invoice.customer?.email,
                },
                items: invoice.items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total
                })),
                payments: invoice.payments?.map(p => ({
                    id: p.id,
                    amount: p.amount,
                    paymentDate: p.paymentDate,
                    paymentMethod: p.paymentMethod,
                    reference: p.reference
                })),
                taxProfile: {
                    legalName: invoice.taxProfile?.legalName,
                    rfc: invoice.taxProfile?.rfc,
                    logoUrl: invoice.taxProfile?.logoUrl,
                    brandColor: invoice.taxProfile?.brandColor,
                    brandFont: invoice.taxProfile?.brandFont,
                    pdfTemplate: invoice.taxProfile?.pdfTemplate
                }
            };
        }
        catch (e) {
            throw new common_1.NotFoundException('Documento no encontrado o no disponible');
        }
    }
    async downloadPublicPdf(id, res) {
        try {
            const invoice = await this.invoicesService.findOne(id);
            const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="factura_${invoice.invoiceNumber}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        }
        catch (e) {
            res.status(404).send('Documento no encontrado');
        }
    }
    async downloadPublicXml(id, res) {
        try {
            const invoice = await this.invoicesService.findOne(id);
            if (!invoice.xmlContent) {
                return res.status(404).send('XML no disponible para esta factura');
            }
            res.set({
                'Content-Type': 'application/xml',
                'Content-Disposition': `attachment; filename="factura_${invoice.invoiceNumber}.xml"`,
            });
            res.send(invoice.xmlContent);
        }
        catch (e) {
            res.status(404).send('Documento no encontrado');
        }
    }
};
exports.PortalController = PortalController;
__decorate([
    (0, common_1.Get)('invoices/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getPublicInvoice", null);
__decorate([
    (0, common_1.Get)('invoices/:id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "downloadPublicPdf", null);
__decorate([
    (0, common_1.Get)('invoices/:id/xml'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "downloadPublicXml", null);
exports.PortalController = PortalController = __decorate([
    (0, common_1.Controller)('portal'),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService,
        pdf_service_1.PdfService])
], PortalController);
//# sourceMappingURL=portal.controller.js.map