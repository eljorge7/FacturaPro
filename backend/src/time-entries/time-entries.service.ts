import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.timeEntry.create({
      data: {
        tenantId,
        projectId: data.projectId,
        taskId: data.taskId || null,
        userId: data.userId,
        date: data.date ? new Date(data.date) : new Date(),
        duration: parseFloat(data.duration),
        notes: data.notes,
        isBilled: data.isBilled || false
      },
      include: { project: true, task: true, user: true }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.timeEntry.findMany({
      where: { tenantId },
      include: { project: true, task: true, user: true },
      orderBy: { date: 'desc' }
    });
  }

  async findByProject(tenantId: string, projectId: string) {
    return this.prisma.timeEntry.findMany({
      where: { tenantId, projectId },
      include: { project: true, task: true, user: true },
      orderBy: { date: 'desc' }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.timeEntry.update({
      where: { id, tenantId },
      data: {
        duration: data.duration ? parseFloat(data.duration) : undefined,
        notes: data.notes,
        isBilled: data.isBilled,
        taskId: data.taskId
      }
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.timeEntry.delete({
      where: { id, tenantId }
    });
  }
}
