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
exports.StockTakesController = void 0;
const common_1 = require("@nestjs/common");
const stock_takes_service_1 = require("./stock-takes.service");
let StockTakesController = class StockTakesController {
    stockTakesService;
    constructor(stockTakesService) {
        this.stockTakesService = stockTakesService;
    }
    create(tenantId, data) {
        return this.stockTakesService.create(tenantId, data);
    }
    findAll(tenantId) {
        return this.stockTakesService.findAll(tenantId);
    }
    findOne(tenantId, id) {
        return this.stockTakesService.findOne(tenantId, id);
    }
    submitCounts(tenantId, id, body) {
        return this.stockTakesService.submitCounts(tenantId, id, body.counts);
    }
    applyAdjustments(tenantId, id) {
        return this.stockTakesService.applyAdjustments(tenantId, id);
    }
};
exports.StockTakesController = StockTakesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockTakesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StockTakesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StockTakesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/submit'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], StockTakesController.prototype, "submitCounts", null);
__decorate([
    (0, common_1.Patch)(':id/apply'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StockTakesController.prototype, "applyAdjustments", null);
exports.StockTakesController = StockTakesController = __decorate([
    (0, common_1.Controller)('stock-takes'),
    __metadata("design:paramtypes", [stock_takes_service_1.StockTakesService])
], StockTakesController);
//# sourceMappingURL=stock-takes.controller.js.map