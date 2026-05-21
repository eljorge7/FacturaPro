import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.proposalTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.proposalTemplate.findFirst({
      where: { id, tenantId }
    });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    return template;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.proposalTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        defaultScope: data.defaultScope,
        defaultNotes: data.defaultNotes,
        defaultPersonnel: data.defaultPersonnel,
        defaultMaterials: data.defaultMaterials,
        coverImageUrl: data.coverImageUrl
      }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const template = await this.findOne(tenantId, id);
    return this.prisma.proposalTemplate.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        defaultScope: data.defaultScope !== undefined ? data.defaultScope : undefined,
        defaultNotes: data.defaultNotes !== undefined ? data.defaultNotes : undefined,
        defaultPersonnel: data.defaultPersonnel !== undefined ? data.defaultPersonnel : undefined,
        defaultMaterials: data.defaultMaterials !== undefined ? data.defaultMaterials : undefined,
        coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : undefined
      }
    });
  }

  async remove(tenantId: string, id: string) {
    const template = await this.findOne(tenantId, id);
    return this.prisma.proposalTemplate.delete({
      where: { id }
    });
  }
}
