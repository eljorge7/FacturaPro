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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BankTransactionsService = class BankTransactionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllByAccount(tenantId, bankAccountId) {
        const account = await this.prisma.bankAccount.findFirst({
            where: { id: bankAccountId, tenantId }
        });
        if (!account)
            throw new common_1.BadRequestException('Account not found');
        return this.prisma.bankTransaction.findMany({
            where: { bankAccountId },
            include: {
                payment: { include: { invoice: { select: { invoiceNumber: true, customer: { select: { legalName: true } } } } } }
            },
            orderBy: { date: 'desc' }
        });
    }
    async createBatch(tenantId, bankAccountId, transactions) {
        const account = await this.prisma.bankAccount.findFirst({
            where: { id: bankAccountId, tenantId }
        });
        if (!account)
            throw new common_1.BadRequestException('Account not found');
        const created = await this.prisma.bankTransaction.createMany({
            data: transactions.map(t => ({
                bankAccountId,
                date: new Date(t.date),
                amount: parseFloat(t.amount),
                description: t.description,
                reference: t.reference,
                type: parseFloat(t.amount) >= 0 ? 'IN' : 'OUT',
                reconciled: false
            })),
            skipDuplicates: true
        });
        const allTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId } });
        const balance = allTxs.reduce((acc, t) => acc + t.amount, 0);
        await this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { balance } });
        return created;
    }
    async getSuggestions(tenantId, transactionId) {
        const transaction = await this.prisma.bankTransaction.findUnique({
            where: { id: transactionId }
        });
        if (!transaction)
            return [];
        if (transaction.type === 'IN') {
            const invoices = await this.prisma.invoice.findMany({
                where: {
                    tenantId,
                    status: { in: ['TIMBRADA', 'DRAFT'] },
                    total: transaction.amount
                },
                include: { customer: true }
            });
            const txContext = `${transaction.description || ''} ${transaction.reference || ''}`.toUpperCase();
            const scoredInvoices = invoices.map(inv => {
                let score = 10;
                const isFolioMatch = inv.invoiceNumber && txContext.includes(inv.invoiceNumber.toUpperCase());
                const isNameMatch = inv.customer.legalName && txContext.includes(inv.customer.legalName.toUpperCase());
                const hasFacturaKeyword = txContext.includes('FAC') || txContext.includes('FACTURA');
                if (isFolioMatch)
                    score += 100;
                if (isNameMatch)
                    score += 50;
                if (score === 10 && hasFacturaKeyword)
                    score += 5;
                return { ...inv, matchScore: score };
            });
            return scoredInvoices.sort((a, b) => b.matchScore - a.matchScore);
        }
        return [];
    }
    async reconcileInvoice(tenantId, transactionId, invoiceId) {
        const transaction = await this.prisma.bankTransaction.findUnique({
            where: { id: transactionId },
            include: { bankAccount: true }
        });
        if (!transaction || transaction.bankAccount.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (transaction.reconciled) {
            throw new common_1.BadRequestException('Ya conciliada');
        }
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId }
        });
        if (!invoice)
            throw new common_1.BadRequestException('Factura Invalida');
        const payment = await this.prisma.payment.create({
            data: {
                invoiceId,
                amount: transaction.amount,
                paymentDate: transaction.date,
                paymentMethod: '03',
                reference: transaction.reference || 'AUTO-CONCILIACION',
            }
        });
        await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID' }
        });
        return this.prisma.bankTransaction.update({
            where: { id: transactionId },
            data: {
                reconciled: true,
                paymentId: payment.id
            }
        });
    }
    async moveTransaction(tenantId, transactionId, targetBankAccountId) {
        const tx = await this.prisma.bankTransaction.findUnique({
            where: { id: transactionId },
            include: { bankAccount: true }
        });
        if (!tx || tx.bankAccount.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Transacción no encontrada o no autorizada');
        }
        const targetAccount = await this.prisma.bankAccount.findFirst({
            where: { id: targetBankAccountId, tenantId }
        });
        if (!targetAccount) {
            throw new common_1.BadRequestException('La bóveda destino no pertenece a tu cuenta o no existe');
        }
        const sourceBankAccountId = tx.bankAccountId;
        if (sourceBankAccountId === targetBankAccountId) {
            return { success: true };
        }
        await this.prisma.bankTransaction.update({
            where: { id: transactionId },
            data: { bankAccountId: targetBankAccountId }
        });
        const allSourceTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId: sourceBankAccountId } });
        const balanceSource = allSourceTxs.reduce((acc, t) => acc + t.amount, 0);
        await this.prisma.bankAccount.update({ where: { id: sourceBankAccountId }, data: { balance: balanceSource } });
        const allTargetTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId: targetBankAccountId } });
        const balanceTarget = allTargetTxs.reduce((acc, t) => acc + t.amount, 0);
        await this.prisma.bankAccount.update({ where: { id: targetBankAccountId }, data: { balance: balanceTarget } });
        return { success: true };
    }
    async deleteTransaction(tenantId, transactionId) {
        const tx = await this.prisma.bankTransaction.findUnique({
            where: { id: transactionId },
            include: { bankAccount: true }
        });
        if (!tx || tx.bankAccount.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Transacción no encontrada o no autorizada');
        }
        if (tx.reconciled) {
            throw new common_1.BadRequestException('No puedes eliminar una transacción que ya está conciliada. Desvincúlala primero.');
        }
        const bankAccountId = tx.bankAccountId;
        await this.prisma.bankTransaction.delete({
            where: { id: transactionId }
        });
        const allTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId } });
        const balance = allTxs.reduce((acc, t) => acc + t.amount, 0);
        await this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { balance } });
        return { success: true };
    }
};
exports.BankTransactionsService = BankTransactionsService;
exports.BankTransactionsService = BankTransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankTransactionsService);
//# sourceMappingURL=bank-transactions.service.js.map