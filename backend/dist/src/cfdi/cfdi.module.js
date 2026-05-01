"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CfdiModule = void 0;
const common_1 = require("@nestjs/common");
const xml_generator_service_1 = require("./xml-generator/xml-generator.service");
const pac_service_1 = require("./pac/pac.service");
let CfdiModule = class CfdiModule {
};
exports.CfdiModule = CfdiModule;
exports.CfdiModule = CfdiModule = __decorate([
    (0, common_1.Module)({
        providers: [xml_generator_service_1.XmlGeneratorService, pac_service_1.PacService],
        exports: [xml_generator_service_1.XmlGeneratorService, pac_service_1.PacService]
    })
], CfdiModule);
//# sourceMappingURL=cfdi.module.js.map