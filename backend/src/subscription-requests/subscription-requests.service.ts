import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SubscriptionRequestsService {
  constructor(private prisma: PrismaService) {}

  async getMyRequests(tenantId: string) {
    return this.prisma.subscriptionRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createSimulation(tenantId: string, payload: { tier: string, amount: number, isAnnual: boolean, paymentMethodId: string }) {
    if (!payload.tier || !payload.amount) throw new BadRequestException("Faltan datos de suscripción");

    // En un sistema real aquí se llama a Stripe.paymentIntents.create({})
    const referenceId = `PAY_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Creamos la petición y la autorizamos automáticamente de inmediato para propósitos del MVP
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.subscriptionRequest.create({
        data: {
          tenantId,
          tier: payload.tier,
          amount: payload.amount,
          isAnnual: payload.isAnnual,
          reference: referenceId,
          phone: "MOCK_PAYMENT",
          status: "APPROVED" // AUTO-APPROVED for MVP
        }
      });

      // Liberar timbres o upgrade status
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId }});
      if (!tenant) throw new BadRequestException('Tenant no encontrado');
      
      let newStamps = tenant.availableStamps;
      let newTier = payload.tier;
      let expiration = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : new Date();

      if (expiration < new Date()) {
          expiration = new Date(); // Reset si ya había espirado
      }

      if (payload.isAnnual) {
          expiration.setFullYear(expiration.getFullYear() + 1);
      } else {
          expiration.setMonth(expiration.getMonth() + 1);
      }

      if (payload.tier === 'PYME') {
          newStamps += 1000;
      } else if (payload.tier === 'EMPRENDEDOR') {
          newStamps += 100;
      } else if (payload.tier === 'CORPORATIVO') {
          newStamps += 5000;
      } else if (payload.tier === 'RECHARGE_50') {
          newStamps += 50;
          newTier = tenant.subscriptionTier; // Mantener el tier actual si es recarga
          expiration = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : new Date(); // Mantener expiración si es recarga pura
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
}
