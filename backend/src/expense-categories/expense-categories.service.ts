import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    let categories = await this.prisma.expenseCategory.findMany({
      where: { tenantId },
    });
    
    // Auto-seed basic categories if none exist
    if (categories.length === 0) {
      await this.prisma.expenseCategory.createMany({
        data: [
          { name: 'Viáticos', color: '#3B82F6', tenantId },
          { name: 'Papelería', color: '#10B981', tenantId },
          { name: 'Servicios', color: '#F59E0B', tenantId },
          { name: 'Renta', color: '#8B5CF6', tenantId },
        ],
      });
      categories = await this.prisma.expenseCategory.findMany({
        where: { tenantId },
      });
    }

    return categories;
  }
}
