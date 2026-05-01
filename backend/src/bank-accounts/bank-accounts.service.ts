import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.bankAccount.findMany({
      where: { tenantId },
      include: {
         transactions: {
            orderBy: { date: 'desc' },
            take: 5
         }
      },
      orderBy: { name: 'asc' }
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.bankAccount.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.bankAccount.findFirst({
      where: { id, tenantId },
      include: { transactions: { orderBy: { date: 'desc' } } }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.bankAccount.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.bankAccount.deleteMany({
      where: { id, tenantId },
    });
  }
}
