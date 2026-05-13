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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.tenantRole.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                permissions: JSON.stringify(data.permissions || []),
                isSystem: false,
            }
        });
    }
    async findAll(tenantId) {
        const roles = await this.prisma.tenantRole.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { users: true } }
            }
        });
        return roles.map(r => ({
            ...r,
            permissions: JSON.parse(r.permissions)
        }));
    }
    async findOne(tenantId, id) {
        const role = await this.prisma.tenantRole.findFirst({
            where: { tenantId, id }
        });
        if (!role)
            throw new common_1.NotFoundException('Rol no encontrado');
        return { ...role, permissions: JSON.parse(role.permissions) };
    }
    async update(tenantId, id, data) {
        const role = await this.findOne(tenantId, id);
        if (role.isSystem)
            throw new Error('Cannot modify system role');
        return this.prisma.tenantRole.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions ? JSON.stringify(data.permissions) : undefined
            }
        });
    }
    async remove(tenantId, id) {
        const role = await this.findOne(tenantId, id);
        if (role.isSystem)
            throw new Error('Cannot delete system role');
        return this.prisma.tenantRole.delete({
            where: { id }
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map