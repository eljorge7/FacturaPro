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
exports.BovedaSatController = void 0;
const common_1 = require("@nestjs/common");
const boveda_sat_service_1 = require("./boveda-sat.service");
const hybrid_auth_guard_1 = require("../auth/hybrid-auth.guard");
let BovedaSatController = class BovedaSatController {
    bovedaSatService;
    constructor(bovedaSatService) {
        this.bovedaSatService = bovedaSatService;
    }
    getRequests(req) {
        const tenantId = req.tenantId || req.query.tenantId;
        return this.bovedaSatService.getRequests(tenantId);
    }
    requestDownload(req, body) {
        const tenantId = req.tenantId || body['tenantId'];
        return this.bovedaSatService.requestDownload(tenantId, { start: body.start, end: body.end }, body.type);
    }
    verifyDownload(req, idSolicitud) {
        const tenantId = req.tenantId || req.query.tenantId;
        return this.bovedaSatService.verifyDownload(tenantId, idSolicitud);
    }
    downloadPackage(req, idPaquete) {
        const tenantId = req.tenantId || req.body.tenantId;
        return this.bovedaSatService.downloadAndProcessPackage(tenantId, idPaquete);
    }
};
exports.BovedaSatController = BovedaSatController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BovedaSatController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BovedaSatController.prototype, "requestDownload", null);
__decorate([
    (0, common_1.Get)('verify/:idSolicitud'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('idSolicitud')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BovedaSatController.prototype, "verifyDownload", null);
__decorate([
    (0, common_1.Post)('download/:idPaquete'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('idPaquete')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BovedaSatController.prototype, "downloadPackage", null);
exports.BovedaSatController = BovedaSatController = __decorate([
    (0, common_1.UseGuards)(hybrid_auth_guard_1.HybridAuthGuard),
    (0, common_1.Controller)('boveda-sat'),
    __metadata("design:paramtypes", [boveda_sat_service_1.BovedaSatService])
], BovedaSatController);
//# sourceMappingURL=boveda-sat.controller.js.map