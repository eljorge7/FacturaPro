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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OmniChatProxyController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmniChatProxyController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OmniChatProxyController = OmniChatProxyController_1 = class OmniChatProxyController {
    prisma;
    logger = new common_1.Logger(OmniChatProxyController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    validateToken(token) {
        const MAGIC_SECRET = process.env.OMNICHAT_WEBHOOK_SECRET || "SUPER_SECRET_KEY_123";
        if (token !== MAGIC_SECRET) {
            throw new common_1.UnauthorizedException("Invalid integration token");
        }
    }
    async identifyCustomer(phone, token) {
        this.validateToken(token);
        const cleanPhone = phone.replace('@c.us', '').slice(-10);
        const customer = await this.prisma.customer.findFirst({
            where: { phone: { contains: cleanPhone } },
            include: {
                invoices: {
                    where: { status: 'DRAFT' },
                    orderBy: { date: 'desc' },
                    take: 5
                }
            }
        });
        if (!customer)
            return { found: false };
        const unbilledOrders = await this.prisma.storeOrder.findMany({
            where: {
                customerPhone: { contains: cleanPhone },
                isFacturado: false,
                status: { not: 'CANCELLED' }
            }
        });
        let context = `El cliente ESTÁ REGISTRADO en FacturaPro con nombre '${customer.legalName}'. `;
        if (unbilledOrders.length > 0) {
            context += `Tiene ${unbilledOrders.length} ticket(s) de compra pendientes de facturar. Los IDs de los tickets son: ${unbilledOrders.map(o => o.id).join(', ')}. `;
            context += `Si el cliente pide su factura, ofrécele generarla y usa la herramienta 'generate_facturapro_invoice_draft' pasando el orderId. `;
        }
        else {
            context += `No tiene compras pendientes de facturar en este momento. `;
        }
        if (customer.invoices.length > 0) {
            context += `Tiene ${customer.invoices.length} facturas en BORRADOR. (IDs: ${customer.invoices.map(i => i.invoiceNumber).join(', ')}). `;
        }
        return {
            found: true,
            customerId: customer.id,
            name: customer.legalName,
            facturaproContext: context
        };
    }
    async generateDraftInvoice(body, token) {
        this.validateToken(token);
        const { orderId } = body;
        if (!orderId) {
            return { success: false, message: "orderId es requerido" };
        }
        const order = await this.prisma.storeOrder.findUnique({
            where: { id: orderId },
            include: { items: true, tenant: { include: { taxProfiles: true } } }
        });
        if (!order) {
            return { success: false, message: "No se encontró el ticket/orden." };
        }
        if (order.isFacturado) {
            return { success: false, message: "La orden ya fue facturada anteriormente." };
        }
        const taxProfile = order.tenant.taxProfiles[0];
        if (!taxProfile) {
            return { success: false, message: "La empresa no tiene un perfil fiscal configurado para facturar." };
        }
        let customer = await this.prisma.customer.findFirst({
            where: { phone: order.customerPhone, tenantId: order.tenantId }
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    tenantId: order.tenantId,
                    legalName: order.customerName,
                    phone: order.customerPhone,
                    rfc: order.billingRfc || 'XAXX010101000',
                    email: 'facturas@cliente.com'
                }
            });
        }
        const tempFolio = 'B-' + Math.floor(Math.random() * 10000);
        const invoice = await this.prisma.invoice.create({
            data: {
                tenantId: order.tenantId,
                taxProfileId: taxProfile.id,
                customerId: customer.id,
                invoiceNumber: tempFolio,
                status: 'DRAFT',
                subtotal: order.totalAmount / 1.16,
                taxTotal: order.totalAmount - (order.totalAmount / 1.16),
                total: order.totalAmount,
                items: {
                    create: order.items.map(item => ({
                        description: item.title,
                        quantity: item.quantity,
                        unitPrice: item.price / 1.16,
                        taxRate: 0.16,
                        total: item.price * item.quantity
                    }))
                }
            }
        });
        await this.prisma.storeOrder.update({
            where: { id: order.id },
            data: { isFacturado: true }
        });
        return {
            success: true,
            invoiceNumber: invoice.invoiceNumber,
            message: "Se ha generado un BORRADOR de la factura exitosamente."
        };
    }
};
exports.OmniChatProxyController = OmniChatProxyController;
__decorate([
    (0, common_1.Get)('identify/:phone'),
    __param(0, (0, common_1.Param)('phone')),
    __param(1, (0, common_1.Headers)('x-api-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OmniChatProxyController.prototype, "identifyCustomer", null);
__decorate([
    (0, common_1.Post)('invoices/generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-api-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OmniChatProxyController.prototype, "generateDraftInvoice", null);
exports.OmniChatProxyController = OmniChatProxyController = OmniChatProxyController_1 = __decorate([
    (0, common_1.Controller)('integrations/omnichat'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OmniChatProxyController);
//# sourceMappingURL=omnichat.controller.js.map