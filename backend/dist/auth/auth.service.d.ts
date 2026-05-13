import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    requestOtp(data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(payload: {
        phone: string;
        code: string;
    }): Promise<{
        token: string;
        tenantId: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar: any;
        };
    }>;
    login(data: any): Promise<{
        token: string;
        tenantId: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar: string | null;
        };
    }>;
    sso(data: any): Promise<{
        token: string;
        tenantId: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar: any;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatar: any;
        birthDate: any;
        tradeName: string | null;
        phone: string | null;
    }>;
    updateProfile(userId: string, data: any): Promise<{
        id: string;
        name: string;
        email: string;
        avatar: any;
        birthDate: any;
    }>;
    getMemberships(userId: string): Promise<{
        primaryTenant: {
            name: string;
            subscriptionTier: string;
            id: string;
            tradeName: string | null;
            agencyId: string | null;
        } | undefined;
        agencyMemberships: {
            name: string;
            subscriptionTier: string;
            id: string;
            tradeName: string | null;
            agencyId: string | null;
        }[];
        isAgencyAdmin: boolean;
        agencyDetails: {
            id: string;
            name: string;
            billingEmail: string;
            stripeCustomerId: string | null;
            subscriptionTier: string;
            maxTenants: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    }>;
    getAgencyTeam(userId: string): Promise<{
        id: string;
        role: string;
        user: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
        };
        joinedAt: Date;
    }[]>;
    switchTenant(userId: string, targetTenantId: string): Promise<{
        token: string;
        tenantId: string;
    }>;
    inviteAgencyMember(adminUserId: string, email: string, role: string, name: string): Promise<{
        message: string;
        success?: undefined;
        member?: undefined;
    } | {
        success: boolean;
        member: {
            user: {
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
            };
        } & {
            id: string;
            agencyId: string;
            userId: string;
            role: string;
            createdAt: Date;
        };
        message?: undefined;
    }>;
    assignWorkspaceTenants(adminUserId: string, targetStaffId: string, tenantIds: string[]): Promise<{
        success: boolean;
        assignedCount: number;
    }>;
    getAgencyMetrics(userId: string): Promise<{
        timbres: {
            mensual: number;
            historico: number;
        };
        tasks: {
            total: number;
            done: number;
            pending: number;
            in_progress: number;
            review: number;
        };
        staffChart: {
            name: string;
            done: number;
            pending: number;
        }[];
        subscriptions: {
            expired: string[];
            expiringSoon: string[];
            active: number;
        };
        totalClientes: number;
        planAcumulado: number;
    }>;
    generateAutoBills(userId: string): Promise<{
        success: boolean;
        count: number;
        message: string;
    }>;
    getAgencyTasks(userId: string): Promise<({
        tenant: {
            name: string;
            id: string;
            tradeName: string | null;
        } | null;
        agency: {
            name: string;
        };
        assignedTo: {
            name: string;
            id: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        agencyId: string;
        title: string;
        description: string | null;
        status: string;
        dueDate: Date | null;
        assignedToId: string | null;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createAgencyTask(userId: string, body: any): Promise<{
        id: string;
        agencyId: string;
        title: string;
        description: string | null;
        status: string;
        dueDate: Date | null;
        assignedToId: string | null;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAgencyTask(userId: string, taskId: string, body: any): Promise<{
        id: string;
        agencyId: string;
        title: string;
        description: string | null;
        status: string;
        dueDate: Date | null;
        assignedToId: string | null;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
