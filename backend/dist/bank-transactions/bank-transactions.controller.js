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
exports.BankTransactionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const bank_transactions_service_1 = require("./bank-transactions.service");
const hybrid_auth_guard_1 = require("../auth/hybrid-auth.guard");
const vision_reconciliation_service_1 = require("./vision-reconciliation.service");
let BankTransactionsController = class BankTransactionsController {
    bankTransactionsService;
    visionService;
    constructor(bankTransactionsService, visionService) {
        this.bankTransactionsService = bankTransactionsService;
        this.visionService = visionService;
    }
    findAll(req, bankAccountId) {
        return this.bankTransactionsService.findAllByAccount(req.user.tenantId, bankAccountId);
    }
    createBatch(req, bankAccountId, data) {
        return this.bankTransactionsService.createBatch(req.user.tenantId, bankAccountId, data);
    }
    getSuggestions(req, txId) {
        return this.bankTransactionsService.getSuggestions(req.user.tenantId, txId);
    }
    reconcileInvoice(req, transactionId, invoiceId) {
        return this.bankTransactionsService.reconcileInvoice(req.user.tenantId, transactionId, invoiceId);
    }
    moveTransaction(req, transactionId, targetBankAccountId) {
        return this.bankTransactionsService.moveTransaction(req.user.tenantId, transactionId, targetBankAccountId);
    }
    deleteTransaction(req, transactionId) {
        return this.bankTransactionsService.deleteTransaction(req.user.tenantId, transactionId);
    }
    async processReceiptVision(req, accountId, file) {
        if (!file) {
            throw new common_1.BadRequestException('Por favor adjunte la imagen del comprobante.');
        }
        if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Formato inválido. Solo PNG, JPEG o PDF.');
        }
        return this.visionService.processReceipt(req.user.tenantId, accountId, file);
    }
};
exports.BankTransactionsController = BankTransactionsController;
__decorate([
    (0, common_1.Get)('account/:accountId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankTransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('account/:accountId/batch'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('accountId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", void 0)
], BankTransactionsController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)(':id/suggestions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankTransactionsController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Post)(':id/reconcile/invoice/:invoiceId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BankTransactionsController.prototype, "reconcileInvoice", null);
__decorate([
    (0, common_1.Put)(':id/move/:targetBankAccountId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('targetBankAccountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BankTransactionsController.prototype, "moveTransaction", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankTransactionsController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Post)('account/:accountId/process-receipt-vision'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('receipt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('accountId')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BankTransactionsController.prototype, "processReceiptVision", null);
exports.BankTransactionsController = BankTransactionsController = __decorate([
    (0, common_1.Controller)('bank-transactions'),
    (0, common_1.UseGuards)(hybrid_auth_guard_1.HybridAuthGuard),
    __metadata("design:paramtypes", [bank_transactions_service_1.BankTransactionsService,
        vision_reconciliation_service_1.VisionReconciliationService])
], BankTransactionsController);
//# sourceMappingURL=bank-transactions.controller.js.map