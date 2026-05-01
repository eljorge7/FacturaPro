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
exports.QuotesController = void 0;
const common_1 = require("@nestjs/common");
const quotes_service_1 = require("./quotes.service");
const create_quote_dto_1 = require("./dto/create-quote.dto");
const update_quote_dto_1 = require("./dto/update-quote.dto");
const pdf_service_1 = require("../invoices/pdf.service");
let QuotesController = class QuotesController {
    quotesService;
    pdfService;
    constructor(quotesService, pdfService) {
        this.quotesService = quotesService;
        this.pdfService = pdfService;
    }
    create(createQuoteDto) {
        return this.quotesService.create(createQuoteDto);
    }
    findAll(tenantId) {
        return this.quotesService.findAll(tenantId);
    }
    findOne(id) {
        return this.quotesService.findOne(id);
    }
    async downloadPdf(id, res) {
        const quote = await this.quotesService.findOne(id);
        const pdfBuffer = await this.pdfService.generateQuotePdf(quote);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="cotizacion_${quote.quoteNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    updateStatus(id, updateQuoteDto) {
        return this.quotesService.updateStatus(id, updateQuoteDto);
    }
    remove(id) {
        return this.quotesService.remove(id);
    }
};
exports.QuotesController = QuotesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_quote_dto_1.CreateQuoteDto]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_quote_dto_1.UpdateQuoteDto]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "remove", null);
exports.QuotesController = QuotesController = __decorate([
    (0, common_1.Controller)('quotes'),
    __metadata("design:paramtypes", [quotes_service_1.QuotesService,
        pdf_service_1.PdfService])
], QuotesController);
//# sourceMappingURL=quotes.controller.js.map