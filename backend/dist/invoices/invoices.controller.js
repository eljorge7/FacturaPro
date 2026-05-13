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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const hybrid_auth_guard_1 = require("../auth/hybrid-auth.guard");
const invoices_service_1 = require("./invoices.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const pdf_service_1 = require("./pdf.service");
let InvoicesController = class InvoicesController {
    invoicesService;
    pdfService;
    constructor(invoicesService, pdfService) {
        this.invoicesService = invoicesService;
        this.pdfService = pdfService;
    }
    create(req, createInvoiceDto, hTenantId) {
        const finalTenantId = req.tenantId || hTenantId;
        if (finalTenantId) {
            createInvoiceDto.tenantId = finalTenantId;
        }
        return this.invoicesService.create(createInvoiceDto);
    }
    findAll(req, hTenantId) {
        const finalTenantId = req.tenantId || hTenantId;
        return this.invoicesService.findAll(finalTenantId);
    }
    getStats(req, hTenantId) {
        const finalTenantId = req.tenantId || hTenantId;
        return this.invoicesService.getStats(finalTenantId);
    }
    getArReport(req, hTenantId) {
        const finalTenantId = req.tenantId || hTenantId;
        return this.invoicesService.getArReport(finalTenantId);
    }
    findOne(id) {
        return this.invoicesService.findOne(id);
    }
    async downloadPdf(id, res) {
        const invoice = await this.invoicesService.findOne(id);
        const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="factura_${invoice.invoiceNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    cancelFiscal(id, body) {
        return this.invoicesService.cancelFiscal(id, body.motive, body.substitutionUuid);
    }
    async registerPayment(id, payload) {
        return this.invoicesService.registerPayment(id, payload);
    }
    cancel(id) {
        return this.invoicesService.cancel(id);
    }
    stamp(id) {
        return this.invoicesService.stamp(id);
    }
    sendWhatsapp(id, payload) {
        if (!payload.phone)
            throw new common_1.BadRequestException('El número de WhatsApp es obligatorio.');
        return this.invoicesService.sendWhatsapp(id, payload.phone);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_invoice_dto_1.CreateInvoiceDto, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('ar-report'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "getArReport", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "cancelFiscal", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "registerPayment", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Patch)(':id/stamp'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "stamp", null);
__decorate([
    (0, common_1.Post)(':id/send-whatsapp'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "sendWhatsapp", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)(hybrid_auth_guard_1.HybridAuthGuard),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService,
        pdf_service_1.PdfService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map