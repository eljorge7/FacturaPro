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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const syscom_dropship_service_1 = require("./syscom-dropship.service");
let StoreManagementService = class StoreManagementService {
    prisma;
    syscomDropship;
    constructor(prisma, syscomDropship) {
        this.prisma = prisma;
        this.syscomDropship = syscomDropship;
    }
    async getProducts(tenantId) {
        return this.prisma.storeProduct.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createProduct(tenantId, data) {
        return this.prisma.storeProduct.create({
            data: {
                ...data,
                tenantId
            }
        });
    }
    async updateProduct(tenantId, id, data) {
        return this.prisma.storeProduct.updateMany({
            where: { id, tenantId },
            data
        });
    }
    async deleteProduct(tenantId, id) {
        return this.prisma.storeProduct.deleteMany({
            where: { id, tenantId }
        });
    }
    async getOrders(tenantId) {
        return this.prisma.storeOrder.findMany({
            where: { tenantId },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateOrderStatus(tenantId, id, status) {
        const updated = await this.prisma.storeOrder.updateMany({
            where: { id, tenantId },
            data: { status }
        });
        if (status === 'PAID') {
            this.syscomDropship.processOrder(tenantId, id).catch(e => {
                console.error("Error in SyscomDropship process:", e);
            });
        }
        return updated;
    }
    async getSettings(tenantId) {
        return this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                hasStoreAccess: true,
                storeEnabled: true,
                storeSlug: true,
                storeCustomDomain: true,
                syscomClientId: true,
                syscomClientSecret: true,
                mercadopagoAccessToken: true
            }
        });
    }
    async updateSettings(tenantId, data) {
        if (data.storeEnabled === true) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant || !tenant.hasStoreAccess) {
                throw new common_1.NotFoundException('Tu plan actual no incluye el acceso a la Tienda en Línea.');
            }
        }
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data
        });
    }
};
exports.StoreManagementService = StoreManagementService;
exports.StoreManagementService = StoreManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        syscom_dropship_service_1.SyscomDropshipService])
], StoreManagementService);
//# sourceMappingURL=store-management.service.js.map