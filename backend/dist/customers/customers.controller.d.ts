import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string;
        taxRegime: string | null;
        zipCode: string | null;
        email: string | null;
        phone: string | null;
        street: string | null;
        city: string | null;
        state: string | null;
        tdsEnabled: boolean;
        portalEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createBulk(body: {
        tenantId: string;
        customers: any[];
    }): Promise<import(".prisma/client").Prisma.BatchPayload> | {
        error: string;
    };
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string;
        taxRegime: string | null;
        zipCode: string | null;
        email: string | null;
        phone: string | null;
        street: string | null;
        city: string | null;
        state: string | null;
        tdsEnabled: boolean;
        portalEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string;
        taxRegime: string | null;
        zipCode: string | null;
        email: string | null;
        phone: string | null;
        street: string | null;
        city: string | null;
        state: string | null;
        tdsEnabled: boolean;
        portalEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string;
        taxRegime: string | null;
        zipCode: string | null;
        email: string | null;
        phone: string | null;
        street: string | null;
        city: string | null;
        state: string | null;
        tdsEnabled: boolean;
        portalEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string;
        taxRegime: string | null;
        zipCode: string | null;
        email: string | null;
        phone: string | null;
        street: string | null;
        city: string | null;
        state: string | null;
        tdsEnabled: boolean;
        portalEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
