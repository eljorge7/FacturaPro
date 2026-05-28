import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class StoreCronService {
  private readonly logger = new Logger(StoreCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
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

        // Llamada al Webhook de OmniChat
        await axios.post('https://api.omnichat.radiotecpro.com/w/6c10a84a-41e9-46d4-9cf0-66fa6723c0e9', {
          phone: order.customerPhone,
          message: messageText,
        });

        // Marcar como recordado
        await this.prisma.storeOrder.update({
          where: { id: order.id },
          data: { reminderSent: true },
        });

        this.logger.log(`Recordatorio enviado a ${order.customerName} (${order.customerPhone})`);
      } catch (error) {
        this.logger.error(`Error enviando recordatorio a la orden ${order.id}:`, error);
      }
    }
  }
}
