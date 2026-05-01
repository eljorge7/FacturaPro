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
exports.TransfersController = void 0;
const common_1 = require("@nestjs/common");
const transfers_service_1 = require("./transfers.service");
let TransfersController = class TransfersController {
    transfersService;
    constructor(transfersService) {
        this.transfersService = transfersService;
    }
    create(tenantId, data) {
        return this.transfersService.create(tenantId, data);
    }
    findAll(tenantId) {
        return this.transfersService.findAll(tenantId);
    }
    receive(tenantId, id, body) {
        return this.transfersService.receive(tenantId, id, body.itemsRecv);
    }
    resolveDiscrepancy(tenantId, id, body) {
        return this.transfersService.resolveDiscrepancy(tenantId, id, body.action);
    }
};
exports.TransfersController = TransfersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/receive'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "receive", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-discrepancy'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "resolveDiscrepancy", null);
exports.TransfersController = TransfersController = __decorate([
    (0, common_1.Controller)('transfers'),
    __metadata("design:paramtypes", [transfers_service_1.TransfersService])
], TransfersController);
//# sourceMappingURL=transfers.controller.js.map