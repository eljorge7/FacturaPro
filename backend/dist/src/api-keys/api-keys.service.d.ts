import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ApiKeysService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createApiKeyDto: CreateApiKeyDto): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
    generateNewKey(tenantId: string, name: string): Promise<{
        rawKey: string;
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
    findMine(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }[]>;
    findAll(): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
    update(id: string, updateApiKeyDto: UpdateApiKeyDto): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
}
