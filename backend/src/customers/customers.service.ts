import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { tenantId, legalName, rfc } = createCustomerDto;
    if (tenantId) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, rfc, legalName }
      });
      if (existing) {
        throw new BadRequestException('Ya existe un cliente con este nombre y RFC en el catálogo.');
      }
    }

    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async createBulk(tenantId: string, data: any[]) {
    // Demo-tenant support
    if (tenantId === 'demo-tenant') {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (firstTenant) tenantId = firstTenant.id;
    }

    const mapData = data.map(c => ({
      ...c,
      tenantId
    }));

    return this.prisma.customer.createMany({
      data: mapData,
      skipDuplicates: true
    });
  }

  async findAll(tenantId: string) {
    let whereFilter = {};
    if (tenantId && tenantId !== 'demo-tenant') {
       whereFilter = { tenantId };
    }
    return this.prisma.customer.findMany({
      where: whereFilter,
      orderBy: { legalName: 'asc' }
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer no encontrado');
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
