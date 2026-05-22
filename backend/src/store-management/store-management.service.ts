import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreManagementService {
  constructor(private prisma: PrismaService) {}

  async getProducts(tenantId: string) {
    return this.prisma.storeProduct.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProduct(tenantId: string, data: any) {
    return this.prisma.storeProduct.create({
      data: {
        ...data,
        tenantId
      }
    });
  }

  async updateProduct(tenantId: string, id: string, data: any) {
    return this.prisma.storeProduct.updateMany({
      where: { id, tenantId },
      data
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    return this.prisma.storeProduct.deleteMany({
      where: { id, tenantId }
    });
  }

  async getOrders(tenantId: string) {
    return this.prisma.storeOrder.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateOrderStatus(tenantId: string, id: string, status: string) {
    return this.prisma.storeOrder.updateMany({
      where: { id, tenantId },
      data: { status }
    });
  }

  async getSettings(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        storeEnabled: true,
        storeSlug: true,
        storeCustomDomain: true,
        syscomClientId: true,
        syscomClientSecret: true,
        mercadopagoAccessToken: true
      }
    });
  }

  async updateSettings(tenantId: string, data: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data
    });
  }
}
