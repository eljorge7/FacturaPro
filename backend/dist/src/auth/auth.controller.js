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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const jwt_1 = require("@nestjs/jwt");
let AuthController = class AuthController {
    authService;
    jwtService;
    constructor(authService, jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }
    async getProfile(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.getProfile(decoded.userId);
    }
    async updateProfile(auth, body) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.updateProfile(decoded.userId, body);
    }
    requestOtp(body) {
        return this.authService.requestOtp(body);
    }
    verifyOtp(body) {
        return this.authService.verifyOtp(body);
    }
    login(body) {
        return this.authService.login(body);
    }
    sso(body) {
        return this.authService.sso(body);
    }
    async getMemberships(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.getMemberships(decoded.userId);
    }
    async getAgencyTeam(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.getAgencyTeam(decoded.userId);
    }
    async switchTenant(auth, body) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.switchTenant(decoded.userId, body.targetTenantId);
    }
    async inviteAgencyMember(auth, body) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.inviteAgencyMember(decoded.userId, body.email, body.role, body.name);
    }
    async assignTenantsToStaff(auth, targetUserId, body) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.assignWorkspaceTenants(decoded.userId, targetUserId, body.tenantIds);
    }
    async getAgencyMetrics(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.getAgencyMetrics(decoded.userId);
    }
    async generateAutoBills(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.generateAutoBills(decoded.userId);
    }
    async getAgencyTasks(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.getAgencyTasks(decoded.userId);
    }
    async createAgencyTask(auth, body) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.createAgencyTask(decoded.userId, body);
    }
    async updateAgencyTask(auth, taskId, body) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.userId)
            throw new common_1.UnauthorizedException();
        return this.authService.updateAgencyTask(decoded.userId, taskId, body);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('request-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('sso'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sso", null);
__decorate([
    (0, common_1.Get)('memberships'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMemberships", null);
__decorate([
    (0, common_1.Get)('agency/team'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAgencyTeam", null);
__decorate([
    (0, common_1.Post)('switch-tenant'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "switchTenant", null);
__decorate([
    (0, common_1.Post)('agency/team/invite'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "inviteAgencyMember", null);
__decorate([
    (0, common_1.Post)('agency/team/:targetUserId/assign-tenants'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Param)('targetUserId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "assignTenantsToStaff", null);
__decorate([
    (0, common_1.Get)('agency/metrics'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAgencyMetrics", null);
__decorate([
    (0, common_1.Post)('agency/auto-bill'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateAutoBills", null);
__decorate([
    (0, common_1.Get)('agency/tasks'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAgencyTasks", null);
__decorate([
    (0, common_1.Post)('agency/tasks'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createAgencyTask", null);
__decorate([
    (0, common_1.Patch)('agency/tasks/:taskId'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateAgencyTask", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map