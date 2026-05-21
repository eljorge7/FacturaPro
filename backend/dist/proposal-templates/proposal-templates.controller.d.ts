import { ProposalTemplatesService } from './proposal-templates.service';
export declare class ProposalTemplatesController {
    private readonly proposalTemplatesService;
    constructor(proposalTemplatesService: ProposalTemplatesService);
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
