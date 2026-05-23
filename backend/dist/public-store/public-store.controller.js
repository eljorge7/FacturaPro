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
exports.PublicStoreController = void 0;
const common_1 = require("@nestjs/common");
const public_store_service_1 = require("./public-store.service");
const jwt_1 = require("@nestjs/jwt");
let PublicStoreController = class PublicStoreController {
    storeService;
    jwtService;
    constructor(storeService, jwtService) {
        this.storeService = storeService;
        this.jwtService = jwtService;
    }
    async register(slug, data) {
        return this.storeService.registerCustomer(slug, data);
    }
    async getMyOrders(slug, auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.storeService.getMyOrders(slug, decoded.userId);
    }
    async testSyscom() {
        return this.storeService.testSyscom();
    }
    async getCatalog(slug, search, page) {
        const pageNum = page ? parseInt(page, 10) : 1;
        return this.storeService.getCombinedCatalog(slug, pageNum);
    }
    async getProductDetails(slug, id) {
        return this.storeService.getProductDetails(slug, id);
    }
    async createOrder(slug, data) {
        return this.storeService.createOrder(slug, data);
    }
    async generatePaymentLink(slug, id) {
        return this.storeService.generatePaymentLink(slug, id);
    }
};
exports.PublicStoreController = PublicStoreController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('my-orders'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('test-syscom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "testSyscom", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "getCatalog", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "getProductDetails", null);
__decorate([
    (0, common_1.Post)('order'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('order/:id/pay'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PublicStoreController.prototype, "generatePaymentLink", null);
exports.PublicStoreController = PublicStoreController = __decorate([
    (0, common_1.Controller)('public-store/:slug'),
    __metadata("design:paramtypes", [public_store_service_1.PublicStoreService,
        jwt_1.JwtService])
], PublicStoreController);
//# sourceMappingURL=public-store.controller.js.map