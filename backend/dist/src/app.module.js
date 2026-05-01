"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const tenants_module_1 = require("./tenants/tenants.module");
const tax_profiles_module_1 = require("./tax-profiles/tax-profiles.module");
const api_keys_module_1 = require("./api-keys/api-keys.module");
const products_module_1 = require("./products/products.module");
const customers_module_1 = require("./customers/customers.module");
const quotes_module_1 = require("./quotes/quotes.module");
const invoices_module_1 = require("./invoices/invoices.module");
const prisma_module_1 = require("./prisma/prisma.module");
const internal_controller_1 = require("./internal/internal.controller");
const suppliers_module_1 = require("./suppliers/suppliers.module");
const expense_categories_module_1 = require("./expense-categories/expense-categories.module");
const expenses_module_1 = require("./expenses/expenses.module");
const diot_module_1 = require("./diot/diot.module");
const auth_module_1 = require("./auth/auth.module");
const subscription_requests_module_1 = require("./subscription-requests/subscription-requests.module");
const cfdi_module_1 = require("./cfdi/cfdi.module");
const pos_module_1 = require("./pos/pos.module");
const users_module_1 = require("./users/users.module");
const purchases_module_1 = require("./purchases/purchases.module");
const inventory_module_1 = require("./inventory/inventory.module");
const sat_catalogs_module_1 = require("./sat-catalogs/sat-catalogs.module");
const boveda_sat_module_1 = require("./boveda-sat/boveda-sat.module");
const efos_module_1 = require("./efos/efos.module");
const sat_scraper_module_1 = require("./sat-scraper/sat-scraper.module");
const bank_accounts_module_1 = require("./bank-accounts/bank-accounts.module");
const bank_transactions_module_1 = require("./bank-transactions/bank-transactions.module");
const warehouses_module_1 = require("./warehouses/warehouses.module");
const transfers_module_1 = require("./transfers/transfers.module");
const stock_takes_module_1 = require("./stock-takes/stock-takes.module");
const employees_module_1 = require("./employees/employees.module");
const roles_module_1 = require("./roles/roles.module");
const payroll_module_1 = require("./payroll/payroll.module");
const departments_module_1 = require("./departments/departments.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_module_1.AuthModule, sat_catalogs_module_1.SatCatalogsModule, tenants_module_1.TenantsModule, tax_profiles_module_1.TaxProfilesModule, api_keys_module_1.ApiKeysModule, products_module_1.ProductsModule, customers_module_1.CustomersModule, quotes_module_1.QuotesModule, invoices_module_1.InvoicesModule, prisma_module_1.PrismaModule, suppliers_module_1.SuppliersModule, expense_categories_module_1.ExpenseCategoriesModule, expenses_module_1.ExpensesModule, diot_module_1.DiotModule, subscription_requests_module_1.SubscriptionRequestsModule, cfdi_module_1.CfdiModule, pos_module_1.PosModule, users_module_1.UsersModule, purchases_module_1.PurchasesModule, inventory_module_1.InventoryModule, boveda_sat_module_1.BovedaSatModule, efos_module_1.EfosModule, sat_scraper_module_1.SatScraperModule, bank_accounts_module_1.BankAccountsModule, bank_transactions_module_1.BankTransactionsModule, warehouses_module_1.WarehousesModule, transfers_module_1.TransfersModule, stock_takes_module_1.StockTakesModule, employees_module_1.EmployeesModule, roles_module_1.RolesModule, payroll_module_1.PayrollModule, departments_module_1.DepartmentsModule
        ],
        controllers: [app_controller_1.AppController, internal_controller_1.InternalController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map