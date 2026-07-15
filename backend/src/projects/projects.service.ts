import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.project.create({
      data: {
        tenantId,
        customerId: data.customerId,
        quoteId: data.quoteId,
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'ACTIVE'
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: { customer: true, quote: true, tasks: true }
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { customer: true, quote: true, tasks: true }
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }
}
