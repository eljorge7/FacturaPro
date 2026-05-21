"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeOffService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TimeOffService = class TimeOffService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRequest(tenantId, employeeId, data) {
        return this.prisma.timeOffRequest.create({
            data: {
                tenantId,
                employeeId,
                type: data.type,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                reason: data.reason,
                status: 'PENDING'
            }
        });
    }
    async getMyRequests(tenantId, employeeId) {
        return this.prisma.timeOffRequest.findMany({
            where: { tenantId, employeeId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAllRequests(tenantId) {
        return this.prisma.timeOffRequest.findMany({
            where: { tenantId },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true, departmentRef: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateStatus(tenantId, id, status, adminNotes, deductedDays) {
        const req = await this.prisma.timeOffRequest.findUnique({
            where: { id, tenantId }
        });
        if (!req) {
            throw new common_1.NotFoundException('Time off request not found');
        }
        return this.prisma.timeOffRequest.update({
            where: { id },
            data: { status, adminNotes, deductedDays: deductedDays ?? undefined }
        });
    }
};
exports.TimeOffService = TimeOffService;
exports.TimeOffService = TimeOffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TimeOffService);
//# sourceMappingURL=time-off.service.js.map