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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StoreCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
let StoreCronService = StoreCronService_1 = class StoreCronService {
    prisma;
    logger = new common_1.Logger(StoreCronService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleAbandonedCarts() {
        this.logger.log('Buscando carritos abandonados...');
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
        const abandonedOrders = await this.prisma.storeOrder.findMany({
            where: {
                status: 'PENDING',
                reminderSent: false,
                createdAt: {
                    lte: twoHoursAgo,
                },
            },
            include: {
                items: true,
                tenant: true,
            },
        });
        if (abandonedOrders.length === 0) {
            this.logger.log('No hay carritos abandonados pendientes de recordar.');
            return;
        }
        this.logger.log(`Se encontraron ${abandonedOrders.length} carritos abandonados.`);
        for (const order of abandonedOrders) {
            try {
                const storeDomain = order.tenant.storeCustomDomain ? order.tenant.storeCustomDomain : `store.radiotecpro.com/${order.tenant.storeSlug}`;
                const storeUrl = `https://${storeDomain}`;
                const messageText = `¡Hola ${order.customerName}! Notamos que dejaste algunos artículos en tu carrito de compras de ${order.tenant.tradeName || order.tenant.name}. ¿Tuviste algún problema con el pago? Puedes finalizar tu compra en cualquier momento haciendo clic aquí: ${storeUrl}`;
                await axios_1.default.post('https://api.omnichat.radiotecpro.com/w/6c10a84a-41e9-46d4-9cf0-66fa6723c0e9', {
                    phone: order.customerPhone,
                    message: messageText,
                });
                await this.prisma.storeOrder.update({
                    where: { id: order.id },
                    data: { reminderSent: true },
                });
                this.logger.log(`Recordatorio enviado a ${order.customerName} (${order.customerPhone})`);
            }
            catch (error) {
                this.logger.error(`Error enviando recordatorio a la orden ${order.id}:`, error);
            }
        }
    }
};
exports.StoreCronService = StoreCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StoreCronService.prototype, "handleAbandonedCarts", null);
exports.StoreCronService = StoreCronService = StoreCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoreCronService);
//# sourceMappingURL=store-cron.service.js.map