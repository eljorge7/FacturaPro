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
exports.ExpenseCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExpenseCategoriesService = class ExpenseCategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        let categories = await this.prisma.expenseCategory.findMany({
            where: { tenantId },
        });
        if (categories.length === 0) {
            await this.prisma.expenseCategory.createMany({
                data: [
                    { name: 'Viáticos', color: '#3B82F6', tenantId },
                    { name: 'Papelería', color: '#10B981', tenantId },
                    { name: 'Servicios', color: '#F59E0B', tenantId },
                    { name: 'Renta', color: '#8B5CF6', tenantId },
                ],
            });
            categories = await this.prisma.expenseCategory.findMany({
                where: { tenantId },
            });
        }
        return categories;
    }
};
exports.ExpenseCategoriesService = ExpenseCategoriesService;
exports.ExpenseCategoriesService = ExpenseCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpenseCategoriesService);
//# sourceMappingURL=expense-categories.service.js.map