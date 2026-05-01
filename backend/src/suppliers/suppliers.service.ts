import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    if (tenantId === 'demo-tenant') {
       const firstTenant = await this.prisma.tenant.findFirst();
       if (firstTenant) tenantId = firstTenant.id;
    }
    return this.prisma.supplier.create({
      data: {
        ...data,
        tenantId
      }
    });
  }

  async findAll(tenantId: string) {
    if (tenantId === 'demo-tenant') {
       const firstTenant = await this.prisma.tenant.findFirst();
       if (firstTenant) tenantId = firstTenant.id;
    }
    return this.prisma.supplier.findMany({
      where: { tenantId },
      include: {
        expenses: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: { expenses: true }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.supplier.update({
      where: { id },
      data
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.supplier.delete({
      where: { id }
    });
  }
}
