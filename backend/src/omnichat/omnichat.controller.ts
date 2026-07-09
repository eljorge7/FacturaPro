import { Controller, Get, Post, Body, Param, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('integrations/omnichat')
export class OmniChatProxyController {
  private readonly logger = new Logger(OmniChatProxyController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private validateToken(token: string) {
     const MAGIC_SECRET = process.env.OMNICHAT_WEBHOOK_SECRET || "SUPER_SECRET_KEY_123";
     if (token !== MAGIC_SECRET) {
        throw new UnauthorizedException("Invalid integration token");
     }
  }

  @Get('identify/:phone')
  async identifyCustomer(@Param('phone') phone: string, @Headers('x-api-key') token: string) {
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

    if (!customer) return { found: false };

    // Buscar ventas de la tienda sin facturar asociadas a este teléfono
    const unbilledOrders = await this.prisma.storeOrder.findMany({
      where: { 
        customerPhone: { contains: cleanPhone },
        isFacturado: false,
        status: { not: 'CANCELLED' }
      }
    });

    let context = `El cliente ESTÁ REGISTRADO en FacturaPro con nombre '${customer.name}'. `;
    
    if (unbilledOrders.length > 0) {
      context += `Tiene ${unbilledOrders.length} ticket(s) de compra pendientes de facturar. Los IDs de los tickets son: ${unbilledOrders.map(o => o.id).join(', ')}. `;
      context += `Si el cliente pide su factura, ofrécele generarla y usa la herramienta 'generate_facturapro_invoice_draft' pasando el orderId. `;
    } else {
      context += `No tiene compras pendientes de facturar en este momento. `;
    }

    if (customer.invoices.length > 0) {
      context += `Tiene ${customer.invoices.length} facturas en BORRADOR. (IDs: ${customer.invoices.map(i => i.invoiceNumber).join(', ')}). `;
    }

    return {
      found: true,
      customerId: customer.id,
      name: customer.name,
      facturaproContext: context
    };
  }

  @Post('invoices/generate')
  async generateDraftInvoice(@Body() body: any, @Headers('x-api-key') token: string) {
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

    // Identificar o crear customer
    let customer = await this.prisma.customer.findFirst({
      where: { phone: order.customerPhone, tenantId: order.tenantId }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          tenantId: order.tenantId,
          name: order.customerName,
          phone: order.customerPhone,
          rfc: order.billingRfc || 'XAXX010101000',
          email: 'facturas@cliente.com',
          type: 'CLIENTE',
        }
      });
    }

    // Generar un folio aleatorio temporal
    const tempFolio = 'B-' + Math.floor(Math.random() * 10000);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId: order.tenantId,
        taxProfileId: taxProfile.id,
        customerId: customer.id,
        invoiceNumber: tempFolio,
        status: 'DRAFT',
        subtotal: order.totalAmount / 1.16,
        taxAmount: order.totalAmount - (order.totalAmount / 1.16),
        total: order.totalAmount,
        notes: `Factura en borrador generada desde OmniChat IA para el Ticket ${order.id}`,
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

    // Opcional: Marcar la orden como 'isFacturado' aunque esté en borrador? Mejor esperar a que se timbre, pero lo marcaremos por ahora para que no intente de nuevo.
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
}
