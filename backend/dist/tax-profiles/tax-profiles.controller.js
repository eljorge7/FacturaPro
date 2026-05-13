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
exports.TaxProfilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const tax_profiles_service_1 = require("./tax-profiles.service");
const jwt_1 = require("@nestjs/jwt");
let TaxProfilesController = class TaxProfilesController {
    taxProfilesService;
    jwtService;
    constructor(taxProfilesService, jwtService) {
        this.taxProfilesService = taxProfilesService;
        this.jwtService = jwtService;
    }
    create(tenantId, data, files) {
        if (!tenantId)
            throw new common_1.UnauthorizedException('Tenant ID requerido');
        let cerBase64 = null;
        let keyBase64 = null;
        if (files?.cerFile?.[0]) {
            cerBase64 = files.cerFile[0].buffer.toString('base64');
        }
        if (files?.keyFile?.[0]) {
            keyBase64 = files.keyFile[0].buffer.toString('base64');
        }
        return this.taxProfilesService.create({
            ...data,
            tenantId,
            ...(cerBase64 ? { cerBase64 } : {}),
            ...(keyBase64 ? { keyBase64 } : {})
        });
    }
    findAll() {
        return this.taxProfilesService.findAll();
    }
    async findMine(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.tenantId)
            throw new common_1.UnauthorizedException();
        return this.taxProfilesService.findMine(decoded.tenantId);
    }
    async getSeries(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.tenantId)
            throw new common_1.UnauthorizedException();
        return this.taxProfilesService.getSeries(decoded.tenantId);
    }
    async createSeries(auth, data) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.tenantId)
            throw new common_1.UnauthorizedException();
        return this.taxProfilesService.createSeries(decoded.tenantId, data);
    }
    async updateSeries(auth, id, data) {
        if (!auth)
            throw new common_1.UnauthorizedException();
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.tenantId)
            throw new common_1.UnauthorizedException();
        return this.taxProfilesService.updateSeries(decoded.tenantId, id, data);
    }
    async deleteSeries(id) {
        return this.taxProfilesService.deleteSeries(id);
    }
    findOne(id) {
        return this.taxProfilesService.findOne(id);
    }
    update(id, updateTaxProfileDto, files) {
        let cerBase64 = null;
        let keyBase64 = null;
        if (files?.cerFile?.[0]) {
            cerBase64 = files.cerFile[0].buffer.toString('base64');
        }
        if (files?.keyFile?.[0]) {
            keyBase64 = files.keyFile[0].buffer.toString('base64');
        }
        return this.taxProfilesService.update(id, {
            ...updateTaxProfileDto,
            ...(cerBase64 ? { cerBase64 } : {}),
            ...(keyBase64 ? { keyBase64 } : {})
        });
    }
    remove(id) {
        return this.taxProfilesService.remove(id);
    }
};
exports.TaxProfilesController = TaxProfilesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'cerFile', maxCount: 1 },
        { name: 'keyFile', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TaxProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaxProfilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaxProfilesController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('series'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaxProfilesController.prototype, "getSeries", null);
__decorate([
    (0, common_1.Post)('series'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaxProfilesController.prototype, "createSeries", null);
__decorate([
    (0, common_1.Patch)('series/:id'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TaxProfilesController.prototype, "updateSeries", null);
__decorate([
    (0, common_1.Delete)('series/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaxProfilesController.prototype, "deleteSeries", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxProfilesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'cerFile', maxCount: 1 },
        { name: 'keyFile', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TaxProfilesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxProfilesController.prototype, "remove", null);
exports.TaxProfilesController = TaxProfilesController = __decorate([
    (0, common_1.Controller)('tax-profiles'),
    __metadata("design:paramtypes", [tax_profiles_service_1.TaxProfilesService,
        jwt_1.JwtService])
], TaxProfilesController);
//# sourceMappingURL=tax-profiles.controller.js.map