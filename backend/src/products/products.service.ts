import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { taxType, kitComponents, ...productData } = createProductDto;
    
    let taxRate = 0.16;
    if (taxType === 'IVA_8') taxRate = 0.08;
    else if (taxType === 'EXENTO') taxRate = 0;
    else if (taxType === 'RET_IVA_10_6') taxRate = -0.1066;

    const dataToCreate: any = {
      ...productData,
      taxRate,
    };

    if (kitComponents && kitComponents.length > 0) {
      dataToCreate.kitComponents = {
        create: kitComponents.map((c: any) => ({ childProductId: c.componentId, quantity: Number(c.quantity) }))
      };
    }

    return this.prisma.product.create({
      data: dataToCreate
    });
  }

  async findAll(tenantId?: string) {
    let whereFilter = {};
    if (tenantId && tenantId !== 'demo-tenant') {
       whereFilter = { tenantId };
    }
    return this.prisma.product.findMany({
      where: whereFilter,
      include: { 
         kitComponents: { include: { childProduct: true } },
         warehouseStocks: { include: { warehouse: true } }
      }
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ 
        where: { id }, 
        include: { 
           kitComponents: { include: { childProduct: true } },
           warehouseStocks: { include: { warehouse: true } }
        } 
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    const { taxType, kitComponents, ...productData } = updateProductDto as any;

    let taxRate = undefined;
    if (taxType === 'IVA_16') taxRate = 0.16;
    else if (taxType === 'IVA_8') taxRate = 0.08;
    else if (taxType === 'EXENTO') taxRate = 0;
    else if (taxType === 'RET_IVA_10_6') taxRate = -0.1066;

    const dataToUpdate: any = {
      ...productData,
      ...(taxRate !== undefined && { taxRate })
    };

    if (Array.isArray(kitComponents)) {
      dataToUpdate.kitComponents = {
        deleteMany: {},
        create: kitComponents.map((c: any) => ({ childProductId: c.componentId, quantity: Number(c.quantity) }))
      };
    }

    return this.prisma.product.update({
      where: { id },
      data: dataToUpdate
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getMovements(productId: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addMovement(tenantId: string, productId: string, payload: any) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({ where: { id: productId } });
      if (!p) throw new NotFoundException('Producto no encontrado');

      const mov = await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId,
          type: payload.type,
          quantity: payload.quantity,
          reference: payload.reference || 'Ajuste Manual'
        }
      });

      const newStock = payload.type === 'IN' ? p.stock + payload.quantity : p.stock - payload.quantity;
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });

      return mov;
    });
  }

  async getSerials(tenantId: string, productId: string, status?: string) {
    const whereClause: any = { productId, tenantId };
    if (status) whereClause.status = status;

    return this.prisma.serialNumber.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
  }
}
