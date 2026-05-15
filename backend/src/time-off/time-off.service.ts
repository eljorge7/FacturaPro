import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeOffService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(tenantId: string, employeeId: string, data: any) {
    return this.prisma.timeOffRequest.create({
      data: {
        tenantId,
        employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: 'PENDING'
      }
    });
  }

  async getMyRequests(tenantId: string, employeeId: string) {
    return this.prisma.timeOffRequest.findMany({
      where: { tenantId, employeeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllRequests(tenantId: string) {
    return this.prisma.timeOffRequest.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true, departmentRef: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(tenantId: string, id: string, status: string, adminNotes?: string) {
    const req = await this.prisma.timeOffRequest.findUnique({
      where: { id, tenantId }
    });
    
    if (!req) {
        throw new NotFoundException('Time off request not found');
    }

    return this.prisma.timeOffRequest.update({
      where: { id },
      data: { status, adminNotes }
    });
  }
}
