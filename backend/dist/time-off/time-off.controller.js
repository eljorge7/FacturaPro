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
exports.TimeOffController = void 0;
const common_1 = require("@nestjs/common");
const time_off_service_1 = require("./time-off.service");
let TimeOffController = class TimeOffController {
    timeOffService;
    constructor(timeOffService) {
        this.timeOffService = timeOffService;
    }
    async createRequest(req, data) {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.UnauthorizedException('User ID not found in request');
        if (!data.employeeId)
            throw new common_1.UnauthorizedException('Employee ID is required');
        return this.timeOffService.createRequest(tenantId, data.employeeId, data);
    }
    getMyRequests(req) {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
        const employeeId = req.query.employeeId;
        if (!employeeId)
            throw new common_1.UnauthorizedException('Employee ID is required');
        return this.timeOffService.getMyRequests(tenantId, employeeId);
    }
    getAllRequests(req) {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
        return this.timeOffService.getAllRequests(tenantId);
    }
    updateStatus(req, id, body) {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
        return this.timeOffService.updateStatus(tenantId, id, body.status, body.adminNotes, body.deductedDays);
    }
};
exports.TimeOffController = TimeOffController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('my-requests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "getAllRequests", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "updateStatus", null);
exports.TimeOffController = TimeOffController = __decorate([
    (0, common_1.Controller)('time-off'),
    __metadata("design:paramtypes", [time_off_service_1.TimeOffService])
], TimeOffController);
//# sourceMappingURL=time-off.controller.js.map