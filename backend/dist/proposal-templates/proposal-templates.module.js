"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const proposal_templates_service_1 = require("./proposal-templates.service");
const proposal_templates_controller_1 = require("./proposal-templates.controller");
let ProposalTemplatesModule = class ProposalTemplatesModule {
};
exports.ProposalTemplatesModule = ProposalTemplatesModule;
exports.ProposalTemplatesModule = ProposalTemplatesModule = __decorate([
    (0, common_1.Module)({
        controllers: [proposal_templates_controller_1.ProposalTemplatesController],
        providers: [proposal_templates_service_1.ProposalTemplatesService]
    })
], ProposalTemplatesModule);
//# sourceMappingURL=proposal-templates.module.js.map