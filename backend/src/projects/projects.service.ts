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
        quoteId: data.quoteId || null,
        name: data.name,
        projectCode: data.projectCode,
        description: data.description,
        billingMethod: data.billingMethod || 'FIXED_COST',
        costBudget: data.costBudget ? parseFloat(data.costBudget) : null,
        revenueBudget: data.revenueBudget ? parseFloat(data.revenueBudget) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'ACTIVE',
        tasks: {
           create: (data.tasks || []).map((t: any) => ({
              title: t.title,
              description: t.description,
              isBillable: t.isBillable !== false,
              hourlyRate: t.hourlyRate ? parseFloat(t.hourlyRate) : null
           }))
        },
        projectUsers: {
           create: (data.users || []).map((u: any) => ({
              userId: u.userId,
              hourlyRate: u.hourlyRate ? parseFloat(u.hourlyRate) : null
           }))
        }
      },
      include: {
         tasks: true,
         projectUsers: { include: { user: true } },
         customer: true
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: { customer: true, quote: true, tasks: true, projectUsers: { include: { user: true } } }
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { customer: true, quote: true, tasks: true, projectUsers: { include: { user: true } } }
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }
}
