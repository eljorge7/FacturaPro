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
exports.TaxProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TaxProfilesService = class TaxProfilesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTaxProfileDto) {
        return this.prisma.taxProfile.create({
            data: createTaxProfileDto,
        });
    }
    async findAll() {
        return this.prisma.taxProfile.findMany();
    }
    async findOne(id) {
        const profile = await this.prisma.taxProfile.findUnique({
            where: { id },
        });
        if (!profile)
            throw new common_1.NotFoundException('Tax Profile not found');
        return profile;
    }
    async findMine(tenantId) {
        let profile = await this.prisma.taxProfile.findFirst({
            where: { tenantId }
        });
        if (!profile) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (tenant) {
                profile = await this.prisma.taxProfile.create({
                    data: {
                        tenantId: tenant.id,
                        rfc: 'XAXX010101000',
                        legalName: tenant.name || 'Empresa Demo S.A de C.V',
                        billingPhone: tenant.phone || '',
                        taxRegime: '601',
                        zipCode: '00000',
                        pdfTemplate: 'Estándar - Estilo europeo'
                    }
                });
            }
            else {
                throw new common_1.NotFoundException('El sistema no está inicializado con un Tenant válido.');
            }
        }
        return profile;
    }
    async update(id, updateTaxProfileDto) {
        const profile = await this.findOne(id);
        let { logoBase64, removeLogo, ...dataToUpdate } = updateTaxProfileDto;
        const fs = require('fs');
        const path = require('path');
        let logoUrl = undefined;
        const cerStr = dataToUpdate.cerBase64 !== undefined ? dataToUpdate.cerBase64 : profile.cerBase64;
        const keyStr = dataToUpdate.keyBase64 !== undefined ? dataToUpdate.keyBase64 : profile.keyBase64;
        const pass = dataToUpdate.keyPassword !== undefined ? dataToUpdate.keyPassword : profile.keyPassword;
        if (cerStr && keyStr && pass && (dataToUpdate.cerBase64 !== undefined || dataToUpdate.keyBase64 !== undefined || dataToUpdate.keyPassword !== undefined)) {
            try {
                const crypto = require('crypto');
                const cleanKey = keyStr.toString().replace(/^data:application\/\w+;base64,/, "");
                const privateKey = crypto.createPrivateKey({
                    key: Buffer.from(cleanKey, 'base64'),
                    format: 'der',
                    type: 'pkcs8',
                    passphrase: pass,
                });
            }
            catch (err) {
                throw new common_1.BadRequestException('El archivo .key o la contraseña proporcionada son inválidos. Los Certificados de Sello Digital (CSD) deben coincidir y estar vigentes.');
            }
        }
        if (removeLogo) {
            dataToUpdate.logoUrl = null;
        }
        else if (logoBase64) {
            try {
                const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
                const fileName = `logo-${id}-${Date.now()}.png`;
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, base64Data, 'base64');
                logoUrl = `/uploads/${fileName}`;
            }
            catch (err) {
                console.error("Error saving logo:", err);
            }
        }
        if (logoUrl) {
            dataToUpdate.logoUrl = logoUrl;
        }
        return this.prisma.taxProfile.update({
            where: { id },
            data: dataToUpdate,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.taxProfile.delete({
            where: { id },
        });
    }
    async getSeries(tenantId) {
        return this.prisma.invoiceSeries.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    }
    async createSeries(tenantId, data) {
        let taxProfile = await this.findMine(tenantId);
        if (data.isDefault) {
            await this.prisma.invoiceSeries.updateMany({
                where: { tenantId, type: data.type || "INVOICE" },
                data: { isDefault: false }
            });
        }
        return this.prisma.invoiceSeries.create({
            data: {
                tenantId,
                taxProfileId: taxProfile.id,
                name: data.name,
                prefix: data.prefix,
                nextFolio: parseInt(data.nextFolio) || 1,
                isDefault: data.isDefault || false,
                type: data.type || "INVOICE"
            }
        });
    }
    async updateSeries(tenantId, id, data) {
        if (data.isDefault) {
            const s = await this.prisma.invoiceSeries.findUnique({ where: { id } });
            if (s) {
                await this.prisma.invoiceSeries.updateMany({
                    where: { tenantId, type: s.type },
                    data: { isDefault: false }
                });
            }
        }
        const updateData = { ...data };
        if (updateData.nextFolio)
            updateData.nextFolio = parseInt(updateData.nextFolio);
        return this.prisma.invoiceSeries.update({
            where: { id },
            data: updateData
        });
    }
    async deleteSeries(id) {
        return this.prisma.invoiceSeries.delete({ where: { id } });
    }
};
exports.TaxProfilesService = TaxProfilesService;
exports.TaxProfilesService = TaxProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxProfilesService);
//# sourceMappingURL=tax-profiles.service.js.map