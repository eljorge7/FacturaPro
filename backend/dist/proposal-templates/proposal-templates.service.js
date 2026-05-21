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
exports.ProposalTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProposalTemplatesService = class ProposalTemplatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.proposalTemplate.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
    }
    async findOne(tenantId, id) {
        const template = await this.prisma.proposalTemplate.findFirst({
            where: { id, tenantId }
        });
        if (!template)
            throw new common_1.NotFoundException('Plantilla no encontrada');
        return template;
    }
    async create(tenantId, data) {
        return this.prisma.proposalTemplate.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                defaultScope: data.defaultScope,
                defaultNotes: data.defaultNotes,
                defaultPersonnel: data.defaultPersonnel,
                defaultMaterials: data.defaultMaterials,
                coverImageUrl: data.coverImageUrl
            }
        });
    }
    async update(tenantId, id, data) {
        const template = await this.findOne(tenantId, id);
        return this.prisma.proposalTemplate.update({
            where: { id },
            data: {
                name: data.name !== undefined ? data.name : undefined,
                description: data.description !== undefined ? data.description : undefined,
                defaultScope: data.defaultScope !== undefined ? data.defaultScope : undefined,
                defaultNotes: data.defaultNotes !== undefined ? data.defaultNotes : undefined,
                defaultPersonnel: data.defaultPersonnel !== undefined ? data.defaultPersonnel : undefined,
                defaultMaterials: data.defaultMaterials !== undefined ? data.defaultMaterials : undefined,
                coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : undefined
            }
        });
    }
    async remove(tenantId, id) {
        const template = await this.findOne(tenantId, id);
        return this.prisma.proposalTemplate.delete({
            where: { id }
        });
    }
};
exports.ProposalTemplatesService = ProposalTemplatesService;
exports.ProposalTemplatesService = ProposalTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProposalTemplatesService);
//# sourceMappingURL=proposal-templates.service.js.map