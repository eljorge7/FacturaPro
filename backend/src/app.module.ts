import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantsModule } from './tenants/tenants.module';
import { TaxProfilesModule } from './tax-profiles/tax-profiles.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { QuotesModule } from './quotes/quotes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PrismaModule } from './prisma/prisma.module';
import { InternalController } from './internal/internal.controller';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DiotModule } from './diot/diot.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionRequestsModule } from './subscription-requests/subscription-requests.module';
import { CfdiModule } from './cfdi/cfdi.module';
import { PosModule } from './pos/pos.module';
import { UsersModule } from './users/users.module';
import { PurchasesModule } from './purchases/purchases.module';
import { InventoryModule } from './inventory/inventory.module';
import { SatCatalogsModule } from './sat-catalogs/sat-catalogs.module';
import { BovedaSatModule } from './boveda-sat/boveda-sat.module';
import { EfosModule } from './efos/efos.module';
import { SatScraperModule } from './sat-scraper/sat-scraper.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BankTransactionsModule } from './bank-transactions/bank-transactions.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { TransfersModule } from './transfers/transfers.module';
import { StockTakesModule } from './stock-takes/stock-takes.module';
import { EmployeesModule } from './employees/employees.module';
import { RolesModule } from './roles/roles.module';
import { PayrollModule } from './payroll/payroll.module';
import { DepartmentsModule } from './departments/departments.module';

import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule, SatCatalogsModule, TenantsModule, TaxProfilesModule, ApiKeysModule, ProductsModule, CustomersModule, QuotesModule, InvoicesModule, PrismaModule, SuppliersModule, ExpenseCategoriesModule, ExpensesModule, DiotModule, SubscriptionRequestsModule, CfdiModule, PosModule, UsersModule, PurchasesModule, InventoryModule, BovedaSatModule, EfosModule, SatScraperModule, BankAccountsModule, BankTransactionsModule, WarehousesModule, TransfersModule, StockTakesModule, EmployeesModule, RolesModule, PayrollModule, DepartmentsModule
  ],
  controllers: [AppController, InternalController],
  providers: [AppService],
})
export class AppModule {}
