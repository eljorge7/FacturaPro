import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    if (tenantId === 'demo-tenant') {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (firstTenant) tenantId = firstTenant.id;
    }

    return this.prisma.expense.findMany({
      where: { tenantId },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(tenantId: string, data: any) {
    if (tenantId === 'demo-tenant') {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (firstTenant) tenantId = firstTenant.id;
    }

    const { providerRfc, providerName, ...expenseData } = data;
    
    let supplierId = null;
    if (providerRfc) {
      let supplier = await this.prisma.supplier.findFirst({
        where: { tenantId, rfc: providerRfc }
      });
      if (!supplier) {
        supplier = await this.prisma.supplier.create({
          data: {
            tenantId,
            rfc: providerRfc,
            legalName: providerName || providerRfc
          }
        });
      }
      supplierId = supplier.id;
    }

    try {
      return await this.prisma.expense.create({
        data: {
          ...expenseData,
          supplierId,
          tenantId,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('satUuid')) {
        throw new BadRequestException('Esta factura (XML) ya ha sido registrada previamente en el sistema.');
      }
      throw e;
    }
  }

  async delete(id: string) {
    return this.prisma.expense.delete({
      where: { id }
    });
  }

  async parseXml(tenantId: string, fileContent: string) {
    if (tenantId === 'demo-tenant') {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (firstTenant) tenantId = firstTenant.id;
    }

    // Attempt to extract Emisor (Provider) and Receptor (Client/Tenant) separately
    const emisorStr = fileContent.match(/Emisor[^>]+>/i);
    let providerRfc = 'XAXX010101000', providerName = 'Proveedor Desconocido';
    if (emisorStr) {
      const rMatch = emisorStr[0].match(/Rfc="([^"]+)"/i);
      const nMatch = emisorStr[0].match(/Nombre="([^"]+)"/i);
      if (rMatch) providerRfc = rMatch[1];
      if (nMatch) providerName = nMatch[1];
    }

    const receptorStr = fileContent.match(/Receptor[^>]+>/i);
    let receiverRfc = '';
    if (receptorStr) {
      const rMatch = receptorStr[0].match(/Rfc="([^"]+)"/i);
      if (rMatch) receiverRfc = rMatch[1];
    }

    // Validate if this XML belongs to the tenant
    let isBelongingToTenant = true;
    let tenantRfcs: string[] = [];
    if (receiverRfc) {
      const taxProfiles = await this.prisma.taxProfile.findMany({
        where: { tenantId },
        select: { rfc: true }
      });
      tenantRfcs = taxProfiles.map(tp => tp.rfc.toUpperCase());
      
      // If the tenant has RFCs registered and none of them match the XML receiver RFC
      if (tenantRfcs.length > 0 && !tenantRfcs.includes(receiverRfc.toUpperCase())) {
        isBelongingToTenant = false;
      }
    }
    
    // Attempt to match totals - using \b to prevent matching SubTotal as Total
    const matchSubTotal = fileContent.match(/subtotal="([\d.]+)"/i) || fileContent.match(/SubTotal="([\d.]+)"/i);
    const matchTotal = fileContent.match(/\btotal="([\d.]+)"/i) || fileContent.match(/\bTotal="([\d.]+)"/i);
    
    // uuid
    const matchUuid = fileContent.match(/UUID="([^"]+)"/i) || fileContent.match(/UUID="([^"]+)"/i);

    const subtotal = matchSubTotal ? parseFloat(matchSubTotal[1]) : 0;
    const total = matchTotal ? parseFloat(matchTotal[1]) : 0;
    const taxTotal = Math.max(0, total - subtotal);
    const uuid = matchUuid ? matchUuid[1] : `SIMULATED-${Date.now()}`;

    return {
      providerRfc,
      providerName,
      subtotal,
      total,
      taxTotal,
      uuid,
      date: new Date(),
      isBelongingToTenant,
      receiverRfc,
      tenantRfcs,
      xmlContentRaw: fileContent
    };
  }
}
