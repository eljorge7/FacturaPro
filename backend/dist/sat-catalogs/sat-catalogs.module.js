"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatCatalogsModule = void 0;
const common_1 = require("@nestjs/common");
const sat_catalogs_controller_1 = require("./sat-catalogs.controller");
const sat_catalogs_service_1 = require("./sat-catalogs.service");
let SatCatalogsModule = class SatCatalogsModule {
};
exports.SatCatalogsModule = SatCatalogsModule;
exports.SatCatalogsModule = SatCatalogsModule = __decorate([
    (0, common_1.Module)({
        controllers: [sat_catalogs_controller_1.SatCatalogsController],
        providers: [sat_catalogs_service_1.SatCatalogsService],
    })
], SatCatalogsModule);
//# sourceMappingURL=sat-catalogs.module.js.map