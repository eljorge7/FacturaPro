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
exports.TopupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TopupsService = class TopupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processTopup(tenantId, type, carrier, amount, reference, invoiceId) {
        const transaction = await this.prisma.topupTransaction.create({
            data: {
                tenantId,
                type,
                carrier,
                amount,
                reference,
                status: 'PENDING',
                invoiceId
            }
        });
        const providerResult = await this.mockProviderCall(carrier, amount, reference);
        if (providerResult.success) {
            await this.prisma.topupTransaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'SUCCESS',
                    providerResponse: {
                        folio: providerResult.folio,
                        timestamp: providerResult.timestamp,
                        message: providerResult.message
                    }
                }
            });
            return { success: true, folio: providerResult.folio, transactionId: transaction.id };
        }
        else {
            await this.prisma.topupTransaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'FAILED',
                    providerResponse: {
                        error: providerResult.error,
                        message: providerResult.message
                    }
                }
            });
            throw new common_1.BadRequestException(`Fallo en el proveedor: ${providerResult.message}`);
        }
    }
    mockProviderCall(carrier, amount, reference) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (reference.startsWith('000')) {
                    resolve({
                        success: false,
                        message: "Número inválido o fuera de servicio.",
                        error: "ERR_INVALID_NUMBER"
                    });
                    return;
                }
                resolve({
                    success: true,
                    folio: `AUTH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                    timestamp: new Date().toISOString(),
                    message: "Aprobado"
                });
            }, 1500);
        });
    }
};
exports.TopupsService = TopupsService;
exports.TopupsService = TopupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TopupsService);
//# sourceMappingURL=topups.service.js.map