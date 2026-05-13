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
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const api_keys_service_1 = require("./api-keys.service");
const create_api_key_dto_1 = require("./dto/create-api-key.dto");
const update_api_key_dto_1 = require("./dto/update-api-key.dto");
let ApiKeysController = class ApiKeysController {
    apiKeysService;
    jwtService;
    constructor(apiKeysService, jwtService) {
        this.apiKeysService = apiKeysService;
        this.jwtService = jwtService;
    }
    create(createApiKeyDto) {
        return this.apiKeysService.create(createApiKeyDto);
    }
    async findMine(auth) {
        if (!auth)
            throw new common_1.UnauthorizedException('Token requerido');
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.tenantId)
            throw new common_1.UnauthorizedException('Token inválido');
        return this.apiKeysService.findMine(decoded.tenantId);
    }
    async generateNewKey(auth, body) {
        if (!auth)
            throw new common_1.UnauthorizedException('Token requerido');
        const token = auth.replace('Bearer ', '');
        const decoded = this.jwtService.decode(token);
        if (!decoded || !decoded.tenantId)
            throw new common_1.UnauthorizedException('Token inválido');
        return this.apiKeysService.generateNewKey(decoded.tenantId, body.name);
    }
    findAll() {
        return this.apiKeysService.findAll();
    }
    findOne(id) {
        return this.apiKeysService.findOne(id);
    }
    update(id, updateApiKeyDto) {
        return this.apiKeysService.update(id, updateApiKeyDto);
    }
    remove(id) {
        return this.apiKeysService.remove(id);
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_api_key_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "findMine", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Headers)('Authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "generateNewKey", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_api_key_dto_1.UpdateApiKeyDto]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "remove", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, common_1.Controller)('api-keys'),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService,
        jwt_1.JwtService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map