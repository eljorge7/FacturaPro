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
exports.ExpenseCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const expense_categories_service_1 = require("./expense-categories.service");
let ExpenseCategoriesController = class ExpenseCategoriesController {
    expenseCategoriesService;
    constructor(expenseCategoriesService) {
        this.expenseCategoriesService = expenseCategoriesService;
    }
    findAll(tenantId) {
        if (!tenantId)
            throw new Error('Tenant ID is required');
        return this.expenseCategoriesService.findAll(tenantId);
    }
};
exports.ExpenseCategoriesController = ExpenseCategoriesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpenseCategoriesController.prototype, "findAll", null);
exports.ExpenseCategoriesController = ExpenseCategoriesController = __decorate([
    (0, common_1.Controller)('expense-categories'),
    __metadata("design:paramtypes", [expense_categories_service_1.ExpenseCategoriesService])
], ExpenseCategoriesController);
//# sourceMappingURL=expense-categories.controller.js.map