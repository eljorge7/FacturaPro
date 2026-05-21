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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.employeeProfile.findMany({
            where: { tenantId },
            include: {
                user: { select: { email: true, role: true, warehouse: { select: { id: true, name: true } } } },
                documents: true,
                departmentRef: { select: { id: true, name: true } }
            },
            orderBy: { firstName: 'asc' }
        });
    }
    async findOne(tenantId, id) {
        const emp = await this.prisma.employeeProfile.findFirst({
            where: { tenantId, id },
            include: {
                user: { select: { email: true, role: true, warehouseId: true } },
                documents: true,
                departmentRef: { select: { id: true, name: true } }
            }
        });
        if (!emp)
            throw new common_1.NotFoundException('Empleado no encontrado');
        return emp;
    }
    async create(tenantId, data) {
        return this.prisma.$transaction(async (tx) => {
            let userId = null;
            if (data.createSystemAccess && data.email && data.password && data.role) {
                const cleanEmail = data.email.trim().toLowerCase();
                const cleanPassword = data.password.trim();
                const existingUser = await tx.user.findUnique({ where: { email: cleanEmail } });
                if (existingUser)
                    throw new common_1.BadRequestException('El correo ya está en uso por otro usuario.');
                const hash = await bcrypt.hash(cleanPassword, 10);
                const newUser = await tx.user.create({
                    data: {
                        tenantId,
                        email: cleanEmail,
                        passwordHash: hash,
                        name: `${data.firstName} ${data.lastName}`,
                        role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                        customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                        warehouseId: data.warehouseId || null
                    }
                });
                userId = newUser.id;
            }
            return tx.employeeProfile.create({
                data: {
                    tenantId,
                    userId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    email: data.email ? data.email.trim().toLowerCase() : null,
                    employeeNumber: data.employeeNumber,
                    departmentId: data.departmentId || null,
                    jobTitle: data.jobTitle,
                    employeeType: data.employeeType || 'DIRECT',
                    rfc: data.rfc,
                    nss: data.nss,
                    curp: data.curp,
                    baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
                    hireDate: data.hireDate ? new Date(data.hireDate) : null,
                    shirtSize: data.shirtSize,
                    pantsSize: data.pantsSize,
                    shoeSize: data.shoeSize,
                    bloodType: data.bloodType,
                    emergencyContact: data.emergencyContact
                }
            });
        });
    }
    async createBulk(tenantId, employeesData) {
        return this.prisma.$transaction(async (tx) => {
            const createdCount = { users: 0, profiles: 0 };
            for (const data of employeesData) {
                let userId = null;
                if (data.createSystemAccess && data.email && data.password && data.role) {
                    const existingUser = await tx.user.findUnique({ where: { email: data.email } });
                    if (!existingUser) {
                        const hash = await bcrypt.hash(data.password, 10);
                        const newUser = await tx.user.create({
                            data: {
                                tenantId,
                                email: data.email,
                                passwordHash: hash,
                                name: `${data.firstName} ${data.lastName}`,
                                role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                                customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                                warehouseId: data.warehouseId || null
                            }
                        });
                        userId = newUser.id;
                        createdCount.users++;
                    }
                }
                await tx.employeeProfile.create({
                    data: {
                        tenantId,
                        userId,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone ? String(data.phone) : null,
                        email: data.email || null,
                        employeeNumber: data.employeeNumber || null,
                        departmentId: data.departmentId || null,
                        jobTitle: data.jobTitle || null,
                        employeeType: data.employeeType || 'DIRECT',
                        rfc: data.rfc || null,
                        nss: data.nss ? String(data.nss) : null,
                        curp: data.curp || null,
                        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
                        hireDate: data.hireDate ? new Date(data.hireDate) : null,
                        shirtSize: data.shirtSize || null,
                        pantsSize: data.pantsSize || null,
                        shoeSize: data.shoeSize || null,
                        bloodType: data.bloodType || null,
                        emergencyContact: data.emergencyContact || null
                    }
                });
                createdCount.profiles++;
            }
            return createdCount;
        });
    }
    async update(tenantId, id, data) {
        const emp = await this.findOne(tenantId, id);
        return this.prisma.$transaction(async (tx) => {
            let newUserId = emp.userId;
            if (emp.userId && data.role) {
                const updateData = {
                    role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                    customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                    warehouseId: data.warehouseId || null
                };
                if (data.password) {
                    updateData.passwordHash = await bcrypt.hash(data.password.trim(), 10);
                }
                await tx.user.update({
                    where: { id: emp.userId },
                    data: updateData
                });
            }
            else if (!emp.userId && data.createSystemAccess && data.email && data.password && data.role) {
                const cleanEmail = data.email.trim().toLowerCase();
                const cleanPassword = data.password.trim();
                const existingUser = await tx.user.findUnique({ where: { email: cleanEmail } });
                if (existingUser)
                    throw new common_1.BadRequestException('El correo ya está en uso por otro usuario.');
                const hash = await bcrypt.hash(cleanPassword, 10);
                const newUser = await tx.user.create({
                    data: {
                        tenantId,
                        email: cleanEmail,
                        passwordHash: hash,
                        name: `${data.firstName || emp.firstName} ${data.lastName || emp.lastName}`,
                        role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                        customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                        warehouseId: data.warehouseId || null
                    }
                });
                newUserId = newUser.id;
            }
            return tx.employeeProfile.update({
                where: { id },
                data: {
                    userId: newUserId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    email: data.email ? data.email.trim().toLowerCase() : null,
                    employeeNumber: data.employeeNumber,
                    departmentId: data.departmentId || null,
                    jobTitle: data.jobTitle,
                    employeeType: data.employeeType || undefined,
                    rfc: data.rfc,
                    nss: data.nss,
                    curp: data.curp,
                    baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : undefined,
                    hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
                    isActive: data.isActive !== undefined ? data.isActive : undefined,
                    shirtSize: data.shirtSize !== undefined ? data.shirtSize : undefined,
                    pantsSize: data.pantsSize !== undefined ? data.pantsSize : undefined,
                    shoeSize: data.shoeSize !== undefined ? data.shoeSize : undefined,
                    bloodType: data.bloodType !== undefined ? data.bloodType : undefined,
                    emergencyContact: data.emergencyContact !== undefined ? data.emergencyContact : undefined
                }
            });
        });
    }
    async updateAvatar(tenantId, id, avatarUrl) {
        const emp = await this.findOne(tenantId, id);
        return this.prisma.employeeProfile.update({
            where: { id },
            data: { avatarUrl }
        });
    }
    async remove(tenantId, id) {
        const emp = await this.findOne(tenantId, id);
        if (emp.userId) {
            await this.prisma.user.update({
                where: { id: emp.userId },
                data: { passwordHash: 'DISABLED' }
            });
        }
        return this.prisma.employeeProfile.update({
            where: { id },
            data: { isActive: false }
        });
    }
    async addDocument(tenantId, id, name, fileUrl) {
        const emp = await this.findOne(tenantId, id);
        return this.prisma.employeeDocument.create({
            data: {
                employeeId: emp.id,
                name,
                fileUrl
            }
        });
    }
    async getPortalData(tenantId, userId) {
        const employee = await this.prisma.employeeProfile.findUnique({
            where: { userId }
        });
        if (!employee || employee.tenantId !== tenantId) {
            return { isEmployee: false, message: 'Perfil de empleado no encontrado' };
        }
        const payslips = await this.prisma.payslip.findMany({
            where: { employeeId: employee.id, status: 'PAID' },
            include: { payrollRun: true },
            orderBy: { createdAt: 'desc' }
        });
        const documents = await this.prisma.employeeDocument.findMany({
            where: { employeeId: employee.id },
            orderBy: { uploadedAt: 'desc' }
        });
        const timeOffRequests = await this.prisma.timeOffRequest.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: 'desc' }
        });
        return {
            employee,
            payslips,
            documents,
            timeOffRequests
        };
    }
    async createTimeOffRequest(tenantId, userId, data) {
        const employee = await this.prisma.employeeProfile.findUnique({
            where: { userId }
        });
        if (!employee || employee.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Perfil de empleado no encontrado para este usuario');
        }
        if (!data.type || !data.startDate || !data.endDate) {
            throw new common_1.BadRequestException('Tipo, fecha de inicio y fecha de fin son obligatorios');
        }
        return this.prisma.timeOffRequest.create({
            data: {
                tenantId,
                employeeId: employee.id,
                type: data.type,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                reason: data.reason || null,
                status: 'PENDING'
            }
        });
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map