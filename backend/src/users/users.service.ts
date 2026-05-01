import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('El correo ya está en uso en otra cuenta.');

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role || 'VIEWER',
        tenantId
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        warehouseId: true,
        warehouse: true,
        createdAt: true
      }
    });
  }

  async remove(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'OWNER') throw new BadRequestException('No puedes eliminar al dueño de la cuenta');

    return this.prisma.user.delete({ where: { id } });
  }

  async update(tenantId: string, id: string, data: any) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const toUpdate: any = {};
    if (data.role !== undefined) toUpdate.role = data.role;
    if (data.warehouseId !== undefined) toUpdate.warehouseId = data.warehouseId === '' ? null : data.warehouseId;

    return this.prisma.user.update({
      where: { id },
      data: toUpdate
    });
  }
}
