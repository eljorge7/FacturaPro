import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('internal')
export class InternalController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('sync-tenant')
  async syncTenant(
    @Headers('x-api-key') apiKey: string,
    @Body() body: { tenantId: string, subscriptionTier: string, stamps: number, hasExpenseControl: boolean, hasApiAccess: boolean }
  ) {
    // Seguridad básica M2M para prevenir abusos
    if (apiKey !== 'FACTURAPRO_MASTER_KEY_2026') {
       throw new UnauthorizedException('Clave de API inválida.');
    }

    // Como FacturaPro y RentControl asumen el mismo Tenant ID (porque el usuario se llama igual)
    // Buscamos/Actualizamos o creamos la empresa basándonos en ese dato:
    
    const existing = await this.prisma.tenant.findUnique({
       where: { id: body.tenantId }
    });

    if (existing) {
       return this.prisma.tenant.update({
          where: { id: body.tenantId },
          data: {
             subscriptionTier: body.subscriptionTier,
             availableStamps: body.stamps,
             hasExpenseControl: body.hasExpenseControl,
             hasApiAccess: body.hasApiAccess
          }
       });
    } else {
       // Opcional: Crear el tenant si no existe. Para simular el entorno actual, 
       // lo asignaremos por defecto si no lo pasaba o actualizar el primero.
       const first = await this.prisma.tenant.findFirst();
       if (first) {
         return this.prisma.tenant.update({
            where: { id: first.id },
            data: {
               subscriptionTier: body.subscriptionTier,
               availableStamps: body.stamps,
               hasExpenseControl: body.hasExpenseControl,
               hasApiAccess: body.hasApiAccess
            }
         });
       }
    }
    return { success: true };
  }
}
