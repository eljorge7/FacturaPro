import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(createApiKeyDto: CreateApiKeyDto) {
    // Generate a secure payload if hash is just a placeholder
    return this.prisma.apiKey.create({
      data: createApiKeyDto,
    });
  }

  async generateNewKey(tenantId: string, name: string) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const record = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name,
        keyHash,
        isActive: true,
      }
    });

    // Devuelve la rawKey solo esta vez para que el usuario la copie a RentControl
    return { ...record, rawKey };
  }

  async findMine(tenantId: string) {
    return this.prisma.apiKey.findMany({ where: { tenantId } });
  }

  async findAll() {
    return this.prisma.apiKey.findMany();
  }

  async findOne(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API Key no encontrada');
    return key;
  }

  async update(id: string, updateApiKeyDto: UpdateApiKeyDto) {
    await this.findOne(id);
    return this.prisma.apiKey.update({
      where: { id },
      data: updateApiKeyDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }
}
