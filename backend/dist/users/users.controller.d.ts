import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(tenantId: string, data: any): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        avatar: string | null;
        birthDate: Date | null;
        role: string;
        customRoleId: string | null;
        tenantId: string;
        warehouseId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        warehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        } | null;
        id: string;
        createdAt: Date;
        email: string;
        role: string;
        warehouseId: string | null;
    }[]>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        avatar: string | null;
        birthDate: Date | null;
        role: string;
        customRoleId: string | null;
        tenantId: string;
        warehouseId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        avatar: string | null;
        birthDate: Date | null;
        role: string;
        customRoleId: string | null;
        tenantId: string;
        warehouseId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
