"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async requestOtp(data) {
        const { name, email, password, legalName, tradeName, phone } = data;
        if (!name || !email || !password || !legalName || !phone) {
            throw new common_1.BadRequestException('Faltan campos obligatorios');
        }
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new common_1.BadRequestException('El correo ya está en uso');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10)
            formattedPhone = `521${formattedPhone}`;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        const otpData = { name, email, passwordHash, legalName, tradeName, phone: formattedPhone };
        await this.prisma.otpVerification.upsert({
            where: { phone: formattedPhone },
            update: { code, expiresAt, data: otpData },
            create: { phone: formattedPhone, code, expiresAt, data: otpData }
        });
        try {
            const omniUrl = process.env.OMNICHAT_API_URL || 'http://127.0.0.1:3002';
            const msg = `🔐 *FacturaPro*\n\nHola ${name}, tu código de verificación es:\n*${code}*\n\n_Válido por 15 minutos._`;
            fetch(`${omniUrl}/api/v1/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer sk_24af03088b47aac20bae7b1df07f8399',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: formattedPhone, text: msg })
            }).catch(e => console.error(e));
        }
        catch (e) { }
        return { success: true, message: 'OTP enviado' };
    }
    async verifyOtp(payload) {
        let formattedPhone = payload.phone.replace(/\D/g, '');
        if (formattedPhone.length === 10)
            formattedPhone = `521${formattedPhone}`;
        const otpRecord = await this.prisma.otpVerification.findUnique({
            where: { phone: formattedPhone }
        });
        if (!otpRecord)
            throw new common_1.BadRequestException('No hay registro pendiente para este número');
        if (otpRecord.code !== payload.code)
            throw new common_1.BadRequestException('Código incorrecto');
        if (new Date() > new Date(otpRecord.expiresAt))
            throw new common_1.BadRequestException('El código expiró');
        const data = otpRecord.data;
        return this.prisma.$transaction(async (tx) => {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);
            const tenant = await tx.tenant.create({
                data: {
                    name: data.legalName,
                    tradeName: data.tradeName || null,
                    phone: data.phone,
                    domain: data.legalName.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4),
                    subscriptionTier: 'TRIAL',
                    availableStamps: 5,
                    subscriptionEndsAt: trialEndsAt
                }
            });
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    passwordHash: data.passwordHash,
                    role: 'OWNER',
                    tenantId: tenant.id
                }
            });
            await tx.otpVerification.delete({ where: { phone: formattedPhone } });
            const jwtPayload = { userId: user.id, email: user.email, tenantId: tenant.id };
            const token = this.jwtService.sign(jwtPayload);
            return {
                token,
                tenantId: tenant.id,
                user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
            };
        });
    }
    async login(data) {
        const { email, password } = data;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (user.passwordHash === 'SSO_MANAGED') {
            throw new common_1.UnauthorizedException('Esta cuenta está enlazada al Control Central. Inicia sesión desde tu portal de administración (RentControl/OmniChat).');
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const payload = { userId: user.id, email: user.email, tenantId: user.tenantId };
        const token = this.jwtService.sign(payload);
        return {
            token,
            tenantId: user.tenantId,
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
        };
    }
    async sso(data) {
        const { email, name, phone, legalName } = data;
        if (!email)
            throw new common_1.BadRequestException('Email requerido para SSO');
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.$transaction(async (tx) => {
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);
                const tenant = await tx.tenant.create({
                    data: {
                        name: legalName || name || "Usuario Sincronizado",
                        phone: phone || "0000000000",
                        domain: (legalName || name || 'tenant').toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4),
                        subscriptionTier: 'TRIAL',
                        availableStamps: 5,
                        subscriptionEndsAt: trialEndsAt
                    }
                });
                const newUser = await tx.user.create({
                    data: {
                        email: email,
                        name: name || email.split('@')[0],
                        passwordHash: 'SSO_MANAGED',
                        role: 'OWNER',
                        tenantId: tenant.id
                    }
                });
                return newUser;
            });
        }
        const payload = { userId: user.id, email: user.email, tenantId: user.tenantId };
        const token = this.jwtService.sign(payload);
        return {
            token,
            tenantId: user.tenantId,
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            birthDate: user.birthDate,
            tradeName: user.tenant?.tradeName,
            phone: user.tenant?.phone
        };
    }
    async updateProfile(userId, data) {
        const { name, email, password, avatar, birthDate, tradeName, phone } = data;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (avatar)
            updateData.avatar = avatar;
        if (birthDate !== undefined) {
            updateData.birthDate = birthDate ? new Date(birthDate) : null;
        }
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }
        const tempUser = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!tempUser)
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        return await this.prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: updateData
            });
            if (tradeName !== undefined || phone !== undefined) {
                const tenantUpdate = {};
                if (tradeName !== undefined)
                    tenantUpdate.tradeName = tradeName;
                if (phone !== undefined)
                    tenantUpdate.phone = phone;
                await tx.tenant.update({
                    where: { id: tempUser.tenantId },
                    data: tenantUpdate
                });
            }
            return {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                birthDate: updatedUser.birthDate
            };
        });
    }
    async getMemberships(userId) {
        const memberships = await this.prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                tenant: {
                    select: { id: true, name: true, tradeName: true, subscriptionTier: true, agencyId: true }
                }
            }
        });
        const agencyRoles = await this.prisma.agencyMember.findMany({
            where: { userId },
            include: { agency: true }
        });
        const isAgencyAdmin = agencyRoles.some(r => r.role === 'OWNER' || r.role === 'MANAGER');
        const primaryUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: { select: { id: true, name: true, tradeName: true, subscriptionTier: true, agencyId: true } }
            }
        });
        return {
            primaryTenant: primaryUser?.tenant,
            agencyMemberships: memberships.map(m => m.tenant),
            isAgencyAdmin,
            agencyDetails: isAgencyAdmin ? agencyRoles[0]?.agency : null
        };
    }
    async getAgencyTeam(userId) {
        const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
        const adminRole = roles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
        if (!adminRole)
            throw new common_1.UnauthorizedException('No eres administrador de ninguna agencia.');
        const team = await this.prisma.agencyMember.findMany({
            where: { agencyId: adminRole.agencyId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        });
        return team.map(member => ({
            id: member.id,
            role: member.role,
            user: member.user,
            joinedAt: member.createdAt
        }));
    }
    async switchTenant(userId, targetTenantId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Usuario no válido');
        if (user.tenantId === targetTenantId) {
            const payload = { userId: user.id, email: user.email, tenantId: user.tenantId };
            return { token: this.jwtService.sign(payload), tenantId: user.tenantId };
        }
        const membership = await this.prisma.workspaceMember.findUnique({
            where: { userId_tenantId: { userId, tenantId: targetTenantId } }
        });
        if (!membership) {
            throw new common_1.UnauthorizedException('No tienes permisos contables ni de agencia sobre esta empresa.');
        }
        const payload = { userId: user.id, email: user.email, tenantId: targetTenantId, isAgencyMode: true };
        return { token: this.jwtService.sign(payload), tenantId: targetTenantId };
    }
    async inviteAgencyMember(adminUserId, email, role, name) {
        const adminRoles = await this.prisma.agencyMember.findMany({ where: { userId: adminUserId } });
        const agencyRole = adminRoles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
        if (!agencyRole)
            throw new common_1.UnauthorizedException('No tienes permisos en esta agencia.');
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    passwordHash: 'TEMPORARY_AGENCY_PASSWORD_' + Math.random().toString(36).substring(7),
                    name,
                    tenant: {
                        create: {
                            name: "Bóveda Personal " + name,
                        }
                    }
                }
            });
        }
        const existing = await this.prisma.agencyMember.findFirst({
            where: { userId: user.id, agencyId: agencyRole.agencyId }
        });
        if (existing) {
            return { message: "El contador ya forma parte de tu agencia." };
        }
        const newMember = await this.prisma.agencyMember.create({
            data: {
                userId: user.id,
                agencyId: agencyRole.agencyId,
                role: role
            },
            include: { user: true }
        });
        return { success: true, member: newMember };
    }
    async assignWorkspaceTenants(adminUserId, targetStaffId, tenantIds) {
        const adminRoles = await this.prisma.agencyMember.findMany({ where: { userId: adminUserId } });
        const agencyRole = adminRoles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
        if (!agencyRole)
            throw new common_1.UnauthorizedException('No tienes permisos en esta agencia.');
        const staff = await this.prisma.agencyMember.findFirst({
            where: { id: targetStaffId, agencyId: agencyRole.agencyId }
        });
        if (!staff)
            throw new common_1.UnauthorizedException('El empleado no existe en tu agencia.');
        await this.prisma.workspaceMember.deleteMany({
            where: { userId: staff.userId }
        });
        for (const tId of tenantIds) {
            await this.prisma.workspaceMember.upsert({
                where: { userId_tenantId: { userId: staff.userId, tenantId: tId } },
                update: { role: 'STAFF' },
                create: { userId: staff.userId, tenantId: tId, role: 'STAFF' }
            });
        }
        return { success: true, assignedCount: tenantIds.length };
    }
    async getAgencyMetrics(userId) {
        const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
        const adminRole = roles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
        if (!adminRole)
            throw new common_1.UnauthorizedException('No tienes permisos de administrador');
        const agencyId = adminRole.agencyId;
        const agency = await this.prisma.accountantAgency.findUnique({
            where: { id: agencyId },
            include: { tenants: { select: { id: true, name: true, subscriptionEndsAt: true, subscriptionTier: true } } }
        });
        if (!agency)
            throw new common_1.BadRequestException('Agencia no encontrada');
        const tenantIds = agency.tenants.map(t => t.id);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const timbresMensuales = await this.prisma.invoice.count({
            where: {
                tenantId: { in: tenantIds },
                status: { in: ['TIMBRADA', 'VIGENTE', 'PAID'] },
                date: { gte: startOfMonth }
            }
        });
        const timbresHistoricos = await this.prisma.invoice.count({
            where: {
                tenantId: { in: tenantIds },
                status: { in: ['TIMBRADA', 'VIGENTE', 'PAID'] }
            }
        });
        const tasks = await this.prisma.agencyTask.findMany({
            where: { agencyId },
            include: { assignedTo: { select: { id: true, name: true, avatar: true } } }
        });
        const staffProductivity = {};
        const globalTasks = { total: tasks.length, done: 0, pending: 0, in_progress: 0, review: 0 };
        tasks.forEach(task => {
            if (task.status === 'DONE')
                globalTasks.done++;
            else if (task.status === 'IN_PROGRESS')
                globalTasks.in_progress++;
            else if (task.status === 'REVIEW')
                globalTasks.review++;
            else
                globalTasks.pending++;
            const staffName = task.assignedTo ? task.assignedTo.name.split(' ')[0] : 'Sin Asignar';
            if (!staffProductivity[staffName]) {
                staffProductivity[staffName] = { done: 0, total: 0 };
            }
            staffProductivity[staffName].total++;
            if (task.status === 'DONE')
                staffProductivity[staffName].done++;
        });
        const staffChart = Object.keys(staffProductivity).map(name => ({
            name,
            done: staffProductivity[name].done,
            pending: staffProductivity[name].total - staffProductivity[name].done
        }));
        const now = new Date();
        const alertDays = new Date();
        alertDays.setDate(alertDays.getDate() + 7);
        const subscriptions = {
            expired: agency.tenants.filter(t => t.subscriptionEndsAt && new Date(t.subscriptionEndsAt) < now).map(t => t.name),
            expiringSoon: agency.tenants.filter(t => t.subscriptionEndsAt && new Date(t.subscriptionEndsAt) >= now && new Date(t.subscriptionEndsAt) <= alertDays).map(t => t.name),
            active: agency.tenants.filter(t => !t.subscriptionEndsAt || new Date(t.subscriptionEndsAt) > alertDays).length
        };
        return {
            timbres: { mensual: timbresMensuales, historico: timbresHistoricos },
            tasks: globalTasks,
            staffChart,
            subscriptions,
            totalClientes: tenantIds.length,
            planAcumulado: agency.tenants.reduce((acc, t) => acc + (t.subscriptionTier === 'CORPORATIVO' ? 3000 : (t.subscriptionTier === 'PYME' ? 1500 : 500)), 0)
        };
    }
    async generateAutoBills(userId) {
        const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
        const adminRole = roles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
        if (!adminRole)
            throw new common_1.UnauthorizedException('No tienes permisos de administrador de agencia');
        const primaryUser = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!primaryUser)
            throw new common_1.UnauthorizedException('Usuario corporativo no encontrado');
        const bovedaId = primaryUser.tenantId;
        const agency = await this.prisma.accountantAgency.findUnique({
            where: { id: adminRole.agencyId },
            include: { tenants: true }
        });
        if (!agency || agency.tenants.length === 0) {
            return { success: true, count: 0, message: "No hay clientes en la agencia." };
        }
        let taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId: bovedaId } });
        if (!taxProfile) {
            taxProfile = await this.prisma.taxProfile.create({
                data: {
                    tenantId: bovedaId,
                    rfc: 'XAXX010101000',
                    legalName: 'MI DESPACHO CONTABLE (PENDIENTE DE CONFIGURAR)',
                    taxRegime: '612',
                    zipCode: '00000',
                    pdfTemplate: 'Estándar - Estilo europeo'
                }
            });
        }
        let generatedCount = 0;
        for (const client of agency.tenants) {
            let customer = await this.prisma.customer.findFirst({
                where: { tenantId: bovedaId, legalName: client.name }
            });
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        tenantId: bovedaId,
                        legalName: client.name,
                        rfc: 'XAXX010101000',
                        taxRegime: '601',
                        zipCode: '00000',
                        email: 'cliente@despacho.com',
                        phone: client.phone || '0000000000'
                    }
                });
            }
            const priceStr = client.subscriptionTier || 'BÁSICO';
            let subtotal = 500;
            if (priceStr === 'PYME')
                subtotal = 1500;
            if (priceStr === 'CORPORATIVO')
                subtotal = 3000;
            const taxRate = 0.16;
            const taxTotal = subtotal * taxRate;
            const total = subtotal + taxTotal;
            await this.prisma.invoice.create({
                data: {
                    tenantId: bovedaId,
                    taxProfileId: taxProfile.id,
                    customerId: customer.id,
                    invoiceNumber: `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    date: new Date(),
                    paymentMethod: 'PPD',
                    paymentForm: '03',
                    cfdiUse: 'G03',
                    subtotal: subtotal,
                    taxTotal: taxTotal,
                    total: total,
                    currency: 'MXN',
                    status: 'DRAFT',
                    items: {
                        create: [{
                                description: `Iguala Contable Mensual - Plan ${priceStr}`,
                                quantity: 1,
                                unitPrice: subtotal,
                                taxRate: taxRate,
                                total: total
                            }]
                    }
                }
            });
            generatedCount++;
        }
        return { success: true, count: generatedCount, message: "Facturas generadas en Borrador" };
    }
    async getAgencyTasks(userId) {
        const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
        if (roles.length === 0)
            return [];
        const agencyId = roles[0].agencyId;
        return this.prisma.agencyTask.findMany({
            where: { agencyId },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                tenant: { select: { id: true, name: true, tradeName: true } },
                agency: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createAgencyTask(userId, body) {
        const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
        if (roles.length === 0)
            throw new common_1.UnauthorizedException('No tienes agencia');
        const agencyId = roles[0].agencyId;
        return this.prisma.agencyTask.create({
            data: {
                agencyId,
                title: body.title,
                description: body.description,
                status: body.status || 'TODO',
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                assignedToId: body.assignedToId || null,
                tenantId: body.tenantId || null
            }
        });
    }
    async updateAgencyTask(userId, taskId, body) {
        const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
        if (roles.length === 0)
            throw new common_1.UnauthorizedException('No tienes agencia');
        const agencyId = roles[0].agencyId;
        const task = await this.prisma.agencyTask.findFirst({ where: { id: taskId, agencyId } });
        if (!task)
            throw new common_1.UnauthorizedException('Tarea no encontrada');
        return this.prisma.agencyTask.update({
            where: { id: taskId },
            data: {
                title: body.title !== undefined ? body.title : undefined,
                description: body.description !== undefined ? body.description : undefined,
                status: body.status !== undefined ? body.status : undefined,
                dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
                assignedToId: body.assignedToId !== undefined ? body.assignedToId : undefined,
                tenantId: body.tenantId !== undefined ? body.tenantId : undefined
            }
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map