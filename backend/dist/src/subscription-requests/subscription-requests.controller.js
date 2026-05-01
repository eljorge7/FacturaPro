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
exports.SubscriptionRequestsController = void 0;
const common_1 = require("@nestjs/common");
const subscription_requests_service_1 = require("./subscription-requests.service");
const hybrid_auth_guard_1 = require("../auth/hybrid-auth.guard");
let SubscriptionRequestsController = class SubscriptionRequestsController {
    subscriptionRequestsService;
    constructor(subscriptionRequestsService) {
        this.subscriptionRequestsService = subscriptionRequestsService;
    }
    getMyRequests(req) {
        return this.subscriptionRequestsService.getMyRequests(req.user.tenantId);
    }
    createCheckoutSession(req, body) {
        return this.subscriptionRequestsService.createSimulation(req.user.tenantId, body);
    }
};
exports.SubscriptionRequestsController = SubscriptionRequestsController;
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionRequestsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SubscriptionRequestsController.prototype, "createCheckoutSession", null);
exports.SubscriptionRequestsController = SubscriptionRequestsController = __decorate([
    (0, common_1.Controller)('subscription-requests'),
    (0, common_1.UseGuards)(hybrid_auth_guard_1.HybridAuthGuard),
    __metadata("design:paramtypes", [subscription_requests_service_1.SubscriptionRequestsService])
], SubscriptionRequestsController);
//# sourceMappingURL=subscription-requests.controller.js.map