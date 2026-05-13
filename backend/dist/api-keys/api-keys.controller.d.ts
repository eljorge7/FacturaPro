import { JwtService } from '@nestjs/jwt';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
export declare class ApiKeysController {
    private readonly apiKeysService;
    private readonly jwtService;
    constructor(apiKeysService: ApiKeysService, jwtService: JwtService);
    create(createApiKeyDto: CreateApiKeyDto): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
    findMine(auth: string): Promise<{
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }[]>;
    generateNewKey(auth: string, body: {
        name: string;
    }): Promise<{
        rawKey: string;
        id: string;
        tenantId: string;
        keyHash: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        lastUsedAt: Date | null;
    }>;
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
