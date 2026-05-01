import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        taxProfiles: true,
      }
    });

    if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not found`);
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    // Verificar si existe
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async requestUpgrade(id: string, payload: { tier: string, isAnnual: boolean, phone: string }) {
    const tenant = await this.findOne(id);
    const user = await this.prisma.user.findFirst({ where: { tenantId: id } });
    
    const cost = payload.tier === 'PYME' ? (payload.isAnnual ? 5590 : 559) :
                 payload.tier === 'CORPORATIVO' ? (payload.isAnnual ? 11990 : 1199) :
                 (payload.isAnnual ? 2390 : 239);
                 
    const refNumber = `FACP-${Date.now().toString().slice(-6)}`;
    
    const tenantPhone = payload.phone || (tenant as any).phone;
    
    // Guardar en la base de datos la solicitud pendiente
    await (this.prisma as any).subscriptionRequest.create({
      data: {
        tenantId: id,
        tier: payload.tier,
        amount: cost,
        reference: refNumber,
        isAnnual: payload.isAnnual,
        phone: tenantPhone || null,
        status: 'PENDING'
      }
    });
    
    try {
       const omniUrl = process.env.OMNICHAT_API_URL || 'http://127.0.0.1:3002';
       const msg = `🚀 ¡Hola ${user?.name || tenant.name}! Has solicitado escalar tu agencia a FacturaPro *${payload.tier}*.\n\n`
                 + `*Total a pagar:* $${cost} MXN\n`
                 + `*Referencia Única:* ${refNumber}\n\n`
                 + `Puedes completar tu activación realizando una transferencia a la cuenta CLABE: *012345678901234567* a nombre de Radiotec Pro (Concepto: ${refNumber}).\n`
                 + `Una vez liquidado, tus timbres se activarán automáticamente.`;

       if (tenantPhone) {
         let formattedPhone = tenantPhone.replace(/\D/g, ''); 
         if (formattedPhone.length === 10) formattedPhone = `521${formattedPhone}`;

         // Intentar contactar directamente la API de OmniChat localmente
         await fetch(`${omniUrl}/api/v1/messages/send`, {
             method: 'POST',
             headers: {
               'Authorization': 'Bearer sk_24af03088b47aac20bae7b1df07f8399',
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({ phone: formattedPhone, text: msg })
         });
       }
    } catch(e) {
       console.error("Error triggering OmniChat:", e);
    }
    
    return { success: true, refNumber, message: 'Reference generated and WhatsApp sent' };
  }

  async findAllUpgradeRequests() {
    return (this.prisma as any).subscriptionRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true }
    });
  }

  async approveUpgrade(reqId: string) {
    const req = await (this.prisma as any).subscriptionRequest.findUnique({
      where: { id: reqId },
      include: { tenant: true }
    });

    if (!req) throw new NotFoundException('Subscription Request no encontrada');
    if (req.status === 'APPROVED') throw new Error('Ya aprobada');

    // Mover Stamps
    const stamps = req.tier === 'PYME' ? 300 : req.tier === 'CORPORATIVO' ? 2000 : 50;
    
    await (this.prisma as any).subscriptionRequest.update({
      where: { id: reqId },
      data: { status: 'APPROVED' }
    });

    await this.prisma.tenant.update({
      where: { id: req.tenantId },
      data: {
        subscriptionTier: req.tier,
        availableStamps: stamps,
        subscriptionEndsAt: null
      } as any
    });

    // Send WhatsApp notification
    if (req.phone) {
       try {
         const omniUrl = process.env.OMNICHAT_API_URL || 'http://127.0.0.1:3002';
         let formattedPhone = req.phone.replace(/\D/g, ''); 
         if (formattedPhone.length === 10) formattedPhone = `521${formattedPhone}`;
         const msg = `👑 ¡Felicidades! Se ha validado tu pago (Ref: ${req.reference}) exitosamente.\n\nTu agencia *${req.tenant.name}* ha sido escalada oficialmente al Módulo *${req.tier}* en FacturaPro con ${stamps} timbres libres.\n🚀 ¡Feliz Lunes de Facturación!`;

         fetch(`${omniUrl}/api/v1/messages/send`, {
             method: 'POST',
             headers: {
               'Authorization': 'Bearer sk_24af03088b47aac20bae7b1df07f8399',
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({ phone: formattedPhone, text: msg })
         }).catch(e => console.error(e));
       } catch (e) {}
    }

    return { success: true, message: 'Plan aprobado y tenant actualizado' };
  }
}
