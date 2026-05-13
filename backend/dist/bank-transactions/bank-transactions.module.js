"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTransactionsModule = void 0;
const common_1 = require("@nestjs/common");
const bank_transactions_controller_1 = require("./bank-transactions.controller");
const bank_transactions_service_1 = require("./bank-transactions.service");
const auth_module_1 = require("../auth/auth.module");
const prisma_module_1 = require("../prisma/prisma.module");
const vision_reconciliation_service_1 = require("./vision-reconciliation.service");
let BankTransactionsModule = class BankTransactionsModule {
};
exports.BankTransactionsModule = BankTransactionsModule;
exports.BankTransactionsModule = BankTransactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        controllers: [bank_transactions_controller_1.BankTransactionsController],
        providers: [bank_transactions_service_1.BankTransactionsService, vision_reconciliation_service_1.VisionReconciliationService]
    })
], BankTransactionsModule);
//# sourceMappingURL=bank-transactions.module.js.map