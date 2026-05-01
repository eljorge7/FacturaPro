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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WarehousesService = class WarehousesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, createWarehouseDto) {
        const isFirst = (await this.prisma.warehouse.count({ where: { tenantId } })) === 0;
        return this.prisma.warehouse.create({
            data: {
                tenantId,
                name: createWarehouseDto.name,
                address: createWarehouseDto.address,
                isDefault: isFirst ? true : (createWarehouseDto.isDefault || false)
            }
        });
    }
    findAll(tenantId) {
        return this.prisma.warehouse.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
    }
    async findOne(tenantId, id) {
        const w = await this.prisma.warehouse.findFirst({
            where: { id, tenantId }
        });
        if (!w)
            throw new common_1.NotFoundException('Warehouse not found');
        return w;
    }
    async setAsDefault(tenantId, id) {
        await this.prisma.warehouse.updateMany({
            where: { tenantId },
            data: { isDefault: false }
        });
        return this.prisma.warehouse.update({
            where: { id },
            data: { isDefault: true }
        });
    }
    async update(tenantId, id, name, address) {
        await this.findOne(tenantId, id);
        return this.prisma.warehouse.update({
            where: { id },
            data: { name, address }
        });
    }
    async remove(tenantId, id) {
        const w = await this.findOne(tenantId, id);
        if (w.isDefault) {
            throw new Error('Cannot delete default warehouse');
        }
        return this.prisma.warehouse.delete({
            where: { id }
        });
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map