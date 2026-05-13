"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let SubscriptionRequestsService = class SubscriptionRequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyRequests(tenantId) {
        return this.prisma.subscriptionRequest.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createSimulation(tenantId, payload) {
        if (!payload.tier || !payload.amount)
            throw new common_1.BadRequestException("Faltan datos de suscripción");
        const referenceId = `PAY_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.subscriptionRequest.create({
                data: {
                    tenantId,
                    tier: payload.tier,
                    amount: payload.amount,
                    isAnnual: payload.isAnnual,
                    reference: referenceId,
                    phone: "MOCK_PAYMENT",
                    status: "APPROVED"
                }
            });
            const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant)
                throw new common_1.BadRequestException('Tenant no encontrado');
            let newStamps = tenant.availableStamps;
            let newTier = payload.tier;
            let expiration = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : new Date();
            if (expiration < new Date()) {
                expiration = new Date();
            }
            if (payload.isAnnual) {
                expiration.setFullYear(expiration.getFullYear() + 1);
            }
            else {
                expiration.setMonth(expiration.getMonth() + 1);
            }
            if (payload.tier === 'PYME') {
                newStamps += 1000;
            }
            else if (payload.tier === 'EMPRENDEDOR') {
                newStamps += 100;
            }
            else if (payload.tier === 'CORPORATIVO') {
                newStamps += 5000;
            }
            else if (payload.tier === 'RECHARGE_50') {
                newStamps += 50;
                newTier = tenant.subscriptionTier;
                expiration = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : new Date();
            }
            await tx.tenant.update({
                where: { id: tenantId },
                data: {
                    availableStamps: newStamps,
                    subscriptionTier: newTier,
                    subscriptionEndsAt: expiration
                }
            });
            return request;
        });
    }
};
exports.SubscriptionRequestsService = SubscriptionRequestsService;
exports.SubscriptionRequestsService = SubscriptionRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionRequestsService);
//# sourceMappingURL=subscription-requests.service.js.map