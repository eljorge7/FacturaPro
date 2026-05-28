import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SyscomDropshipService {
  private readonly logger = new Logger(SyscomDropshipService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processOrder(tenantId: string, orderId: string) {
    this.logger.log(`Evaluando orden ${orderId} para Syscom Dropshipping...`);

    const order = await this.prisma.storeOrder.findUnique({
      where: { id: orderId },
      include: { tenant: true, items: true }
    });

    if (!order || order.status !== 'PAID') {
      return;
    }

    const tenant = order.tenant;
    
    // Si el toggle est apagado o el total es menor a 5000, solo notificar
    if (!tenant.enableSyscomDropship || order.totalAmount < 5000) {
      await this.handlePendingGrouping(tenant, order);
      return;
    }

    // Si el toggle est prendido y la orden >= 5000, ejecutar dropshipping
    await this.handleDropshipping(tenant, order);
  }

  private async handlePendingGrouping(tenant: any, order: any) {
    this.logger.log(`Orden ${order.id} marcada como PENDING_GROUPING.`);

    // Cambiar estado
    await this.prisma.storeOrder.update({
      where: { id: order.id },
      data: { status: 'PENDING_GROUPING' }
    });

    // Enviar notificacin a OmniChat (A la lnea interna del administrador)
    // Asumimos que podemos enviar un mensaje interno de aviso
    try {
      // Nota: idealmente aqu usamos un telfono admin configurado en tenant.phone
      const adminPhone = tenant.phone || '0000000000'; 
      const messageText = `¡Venta Pagada en Tienda! La orden de ${order.customerName} por $${order.totalAmount} MXN está pagada y retenida en estado PENDING_GROUPING. ¡Revísala en tu panel para procesarla o agruparla!`;

      await axios.post('https://api.omnichat.radiotecpro.com/w/6c10a84a-41e9-46d4-9cf0-66fa6723c0e9', {
        phone: adminPhone,
        message: messageText,
      });
      this.logger.log(`Alerta OmniChat enviada al admin para la orden ${order.id}`);
    } catch (error) {
      this.logger.error(`Error enviando alerta OmniChat al admin:`, error);
    }
  }

  private async handleDropshipping(tenant: any, order: any) {
    this.logger.log(`Ejecutando Dropshipping automtico a Syscom para la orden ${order.id}...`);
    
    // TODO: Implementar llamada real a la API de Syscom aqu
    try {
      // Pseudo-cdigo para futura integracin:
      // 1. Validar Token de Syscom de este Tenant
      // 2. Armar carrito en Syscom
      // 3. Crear direccin de envo con datos de `order`
      // 4. Proceder a checkout (pago descontado de la cuenta Syscom del distribuidor)
      // 5. Guardar syscomOrderId
      
      // Simulacin exitosa:
      await this.prisma.storeOrder.update({
        where: { id: order.id },
        data: { status: 'DROPSHIPPED' }
      });

      this.logger.log(`Orden ${order.id} enviada exitosamente a Syscom (Simulacin).`);
      
      // Notificar al admin del xito
      const adminPhone = tenant.phone || '0000000000'; 
      const messageText = `¡Dropshipping Exitoso! La orden de ${order.customerName} por $${order.totalAmount} MXN fue enviada automáticamente a Syscom.`;
      
      await axios.post('https://api.omnichat.radiotecpro.com/w/6c10a84a-41e9-46d4-9cf0-66fa6723c0e9', {
        phone: adminPhone,
        message: messageText,
      }).catch(e => console.error(e));

    } catch (e) {
      this.logger.error(`Error conectando con Syscom para orden ${order.id}:`, e);
      // Fallback a PENDING_GROUPING
      await this.handlePendingGrouping(tenant, order);
    }
  }
}
