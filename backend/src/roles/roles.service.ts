import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.tenantRole.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        permissions: JSON.stringify(data.permissions || []),
        isSystem: false,
      }
    });
  }

  async findAll(tenantId: string) {
    const roles = await this.prisma.tenantRole.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true } }
      }
    });
    
    // Parse json
    return roles.map(r => ({
      ...r,
      permissions: JSON.parse(r.permissions)
    }));
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.tenantRole.findFirst({
      where: { tenantId, id }
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return { ...role, permissions: JSON.parse(role.permissions) };
  }

  async update(tenantId: string, id: string, data: any) {
    const role = await this.findOne(tenantId, id);
    if (role.isSystem) throw new Error('Cannot modify system role');
    
    return this.prisma.tenantRole.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions ? JSON.stringify(data.permissions) : undefined
      }
    });
  }

  async remove(tenantId: string, id: string) {
    const role = await this.findOne(tenantId, id);
    if (role.isSystem) throw new Error('Cannot delete system role');

    return this.prisma.tenantRole.delete({
      where: { id }
    });
  }
}
