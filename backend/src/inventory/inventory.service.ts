import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) {}

    async getAllMovements(tenantId: string) {
        return this.prisma.inventoryMovement.findMany({
            where: { tenantId },
            include: {
                product: {
                    select: { name: true, sku: true, supplierSku: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
