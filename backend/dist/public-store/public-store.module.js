"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicStoreModule = void 0;
const common_1 = require("@nestjs/common");
const public_store_service_1 = require("./public-store.service");
const public_store_controller_1 = require("./public-store.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const jwt_1 = require("@nestjs/jwt");
let PublicStoreModule = class PublicStoreModule {
};
exports.PublicStoreModule = PublicStoreModule;
exports.PublicStoreModule = PublicStoreModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
                signOptions: { expiresIn: '7d' },
            })
        ],
        controllers: [public_store_controller_1.PublicStoreController],
        providers: [public_store_service_1.PublicStoreService],
    })
], PublicStoreModule);
//# sourceMappingURL=public-store.module.js.map