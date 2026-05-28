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
var SyscomDropshipService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyscomDropshipService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
let SyscomDropshipService = SyscomDropshipService_1 = class SyscomDropshipService {
    prisma;
    logger = new common_1.Logger(SyscomDropshipService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processOrder(tenantId, orderId) {
        this.logger.log(`Evaluando orden ${orderId} para Syscom Dropshipping...`);
        const order = await this.prisma.storeOrder.findUnique({
            where: { id: orderId },
            include: { tenant: true, items: true }
        });
        if (!order || order.status !== 'PAID') {
            return;
        }
        const tenant = order.tenant;
        if (!tenant.enableSyscomDropship || order.totalAmount < 5000) {
            await this.handlePendingGrouping(tenant, order);
            return;
        }
        await this.handleDropshipping(tenant, order);
    }
    async handlePendingGrouping(tenant, order) {
        this.logger.log(`Orden ${order.id} marcada como PENDING_GROUPING.`);
        await this.prisma.storeOrder.update({
            where: { id: order.id },
            data: { status: 'PENDING_GROUPING' }
        });
        try {
            const adminPhone = tenant.phone || '0000000000';
            const messageText = `¡Venta Pagada en Tienda! La orden de ${order.customerName} por $${order.totalAmount} MXN está pagada y retenida en estado PENDING_GROUPING. ¡Revísala en tu panel para procesarla o agruparla!`;
            await axios_1.default.post('https://api.omnichat.radiotecpro.com/w/6c10a84a-41e9-46d4-9cf0-66fa6723c0e9', {
                phone: adminPhone,
                message: messageText,
            });
            this.logger.log(`Alerta OmniChat enviada al admin para la orden ${order.id}`);
        }
        catch (error) {
            this.logger.error(`Error enviando alerta OmniChat al admin:`, error);
        }
    }
    async handleDropshipping(tenant, order) {
        this.logger.log(`Ejecutando Dropshipping automtico a Syscom para la orden ${order.id}...`);
        try {
            await this.prisma.storeOrder.update({
                where: { id: order.id },
                data: { status: 'DROPSHIPPED' }
            });
            this.logger.log(`Orden ${order.id} enviada exitosamente a Syscom (Simulacin).`);
            const adminPhone = tenant.phone || '0000000000';
            const messageText = `¡Dropshipping Exitoso! La orden de ${order.customerName} por $${order.totalAmount} MXN fue enviada automáticamente a Syscom.`;
            await axios_1.default.post('https://api.omnichat.radiotecpro.com/w/6c10a84a-41e9-46d4-9cf0-66fa6723c0e9', {
                phone: adminPhone,
                message: messageText,
            }).catch(e => console.error(e));
        }
        catch (e) {
            this.logger.error(`Error conectando con Syscom para orden ${order.id}:`, e);
            await this.handlePendingGrouping(tenant, order);
        }
    }
};
exports.SyscomDropshipService = SyscomDropshipService;
exports.SyscomDropshipService = SyscomDropshipService = SyscomDropshipService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyscomDropshipService);
//# sourceMappingURL=syscom-dropship.service.js.map