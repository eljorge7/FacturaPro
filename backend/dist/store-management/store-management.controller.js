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
exports.StoreManagementController = void 0;
const common_1 = require("@nestjs/common");
const store_management_service_1 = require("./store-management.service");
let StoreManagementController = class StoreManagementController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSettings(tenantId) {
        return this.service.getSettings(tenantId);
    }
    async updateSettings(tenantId, data) {
        return this.service.updateSettings(tenantId, data);
    }
    async getProducts(tenantId) {
        return this.service.getProducts(tenantId);
    }
    async createProduct(tenantId, data) {
        return this.service.createProduct(tenantId, data);
    }
    async updateProduct(tenantId, id, data) {
        return this.service.updateProduct(tenantId, id, data);
    }
    async deleteProduct(tenantId, id) {
        return this.service.deleteProduct(tenantId, id);
    }
    async getOrders(tenantId) {
        return this.service.getOrders(tenantId);
    }
    async updateOrderStatus(tenantId, id, status) {
        return this.service.updateOrderStatus(tenantId, id, status);
    }
};
exports.StoreManagementController = StoreManagementController;
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('products/:id'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StoreManagementController.prototype, "updateOrderStatus", null);
exports.StoreManagementController = StoreManagementController = __decorate([
    (0, common_1.Controller)('store-management'),
    __metadata("design:paramtypes", [store_management_service_1.StoreManagementService])
], StoreManagementController);
//# sourceMappingURL=store-management.controller.js.map