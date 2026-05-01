import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createWarehouseDto: CreateWarehouseDto) {
    const isFirst = (await this.prisma.warehouse.count({ where: { tenantId } })) === 0;
    
    return this.prisma.warehouse.create({
      data: {
        tenantId,
        name: createWarehouseDto.name,
        address: createWarehouseDto.address,
        isDefault: isFirst ? true : (createWarehouseDto.isDefault || false)
      }
    });
  }

  findAll(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(tenantId: string, id: string) {
    const w = await this.prisma.warehouse.findFirst({
        where: { id, tenantId }
    });
    if (!w) throw new NotFoundException('Warehouse not found');
    return w;
  }

  async setAsDefault(tenantId: string, id: string) {
     await this.prisma.warehouse.updateMany({
         where: { tenantId },
         data: { isDefault: false }
     });
     return this.prisma.warehouse.update({
         where: { id },
         data: { isDefault: true }
     });
  }

  async update(tenantId: string, id: string, name: string, address?: string) {
      await this.findOne(tenantId, id); // ensure exists and belongs to tenant
      return this.prisma.warehouse.update({
          where: { id },
          data: { name, address }
      });
  }

  async remove(tenantId: string, id: string) {
      const w = await this.findOne(tenantId, id);
      if (w.isDefault) {
          throw new Error('Cannot delete default warehouse');
      }
      return this.prisma.warehouse.delete({
          where: { id }
      });
  }
}
