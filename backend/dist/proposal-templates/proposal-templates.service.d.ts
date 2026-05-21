import { PrismaService } from '../prisma/prisma.service';
export declare class ProposalTemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        defaultScope: string | null;
        defaultNotes: string | null;
        defaultPersonnel: string | null;
        defaultMaterials: string | null;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        defaultScope: string | null;
        defaultNotes: string | null;
        defaultPersonnel: string | null;
        defaultMaterials: string | null;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        defaultScope: string | null;
        defaultNotes: string | null;
        defaultPersonnel: string | null;
        defaultMaterials: string | null;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        defaultScope: string | null;
        defaultNotes: string | null;
        defaultPersonnel: string | null;
        defaultMaterials: string | null;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        defaultScope: string | null;
        defaultNotes: string | null;
        defaultPersonnel: string | null;
        defaultMaterials: string | null;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
