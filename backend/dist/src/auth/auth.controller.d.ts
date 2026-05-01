import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthController {
    private readonly authService;
    private readonly jwtService;
    constructor(authService: AuthService, jwtService: JwtService);
    getProfile(auth: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatar: any;
        birthDate: any;
        tradeName: string | null;
        phone: string | null;
    }>;
    updateProfile(auth: string, body: any): Promise<{
        id: string;
        name: string;
        email: string;
        avatar: any;
        birthDate: any;
    }>;
    requestOtp(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(body: any): Promise<{
        token: string;
        tenantId: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar: any;
        };
    }>;
    login(body: any): Promise<{
        token: string;
        tenantId: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar: string | null;
        };
    }>;
    sso(body: any): Promise<{
        token: string;
        tenantId: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar: any;
        };
    }>;
    getMemberships(auth: string): Promise<{
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
    getAgencyTeam(auth: string): Promise<{
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
    switchTenant(auth: string, body: {
        targetTenantId: string;
    }): Promise<{
        token: string;
        tenantId: string;
    }>;
    inviteAgencyMember(auth: string, body: {
        email: string;
        role: string;
        name: string;
    }): Promise<{
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
    assignTenantsToStaff(auth: string, targetUserId: string, body: {
        tenantIds: string[];
    }): Promise<{
        success: boolean;
        assignedCount: number;
    }>;
    getAgencyMetrics(auth: string): Promise<{
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
    generateAutoBills(auth: string): Promise<{
        success: boolean;
        count: number;
        message: string;
    }>;
    getAgencyTasks(auth: string): Promise<({
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
    createAgencyTask(auth: string, body: any): Promise<{
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
    updateAgencyTask(auth: string, taskId: string, body: any): Promise<{
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
