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
exports.PosController = void 0;
const common_1 = require("@nestjs/common");
const pos_service_1 = require("./pos.service");
let PosController = class PosController {
    posService;
    constructor(posService) {
        this.posService = posService;
    }
    async checkout(payload, req) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.posService.checkout(tenantId, payload);
    }
    async getCurrentShift(req) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.posService.getCurrentShift(tenantId);
    }
    async openShift(payload, req) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.posService.openShift(tenantId, payload);
    }
    async getShiftSummary(req) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.posService.getShiftSummary(tenantId, req.params.id);
    }
    async closeShift(req, payload) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.posService.closeShift(tenantId, req.params.id, payload.userId);
    }
    async addMovement(req, payload) {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId)
            throw new common_1.UnauthorizedException('TenantID missing');
        return this.posService.addMovement(tenantId, req.params.id, payload);
    }
};
exports.PosController = PosController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('shifts/current'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getCurrentShift", null);
__decorate([
    (0, common_1.Post)('shifts/open'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "openShift", null);
__decorate([
    (0, common_1.Get)('shifts/:id/summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getShiftSummary", null);
__decorate([
    (0, common_1.Post)('shifts/:id/close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "closeShift", null);
__decorate([
    (0, common_1.Post)('shifts/:id/movements'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "addMovement", null);
exports.PosController = PosController = __decorate([
    (0, common_1.Controller)('pos'),
    __metadata("design:paramtypes", [pos_service_1.PosService])
], PosController);
//# sourceMappingURL=pos.controller.js.map