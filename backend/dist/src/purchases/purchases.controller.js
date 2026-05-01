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
exports.PurchasesController = void 0;
const common_1 = require("@nestjs/common");
const purchases_service_1 = require("./purchases.service");
let PurchasesController = class PurchasesController {
    purchasesService;
    constructor(purchasesService) {
        this.purchasesService = purchasesService;
    }
    async getAllPurchases(req) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.getAllPurchases(tenantId);
    }
    async getApReport(req) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.getApReport(tenantId);
    }
    async createPurchase(req, payload) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.createPurchase(tenantId, payload);
    }
    async deletePurchase(req, id) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.deletePurchase(tenantId, id);
    }
    async updatePurchase(req, id, payload) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.updatePurchase(tenantId, id, payload);
    }
    async receivePurchase(req, id, payload) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.receivePurchase(tenantId, id, payload.items);
    }
    async addPayment(req, id, payload) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.purchasesService.addPayment(tenantId, id, payload);
    }
};
exports.PurchasesController = PurchasesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "getAllPurchases", null);
__decorate([
    (0, common_1.Get)('ap-report'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "getApReport", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "createPurchase", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "deletePurchase", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "updatePurchase", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "receivePurchase", null);
__decorate([
    (0, common_1.Post)(':id/payment'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "addPayment", null);
exports.PurchasesController = PurchasesController = __decorate([
    (0, common_1.Controller)('purchases'),
    __metadata("design:paramtypes", [purchases_service_1.PurchasesService])
], PurchasesController);
//# sourceMappingURL=purchases.controller.js.map