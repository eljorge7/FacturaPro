import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BankTransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAllByAccount(tenantId: string, bankAccountId: string) {
    // Verificar propiedad
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId }
    });
    if (!account) throw new BadRequestException('Account not found');

    return this.prisma.bankTransaction.findMany({
      where: { bankAccountId },
      include: {
         payment: { include: { invoice: { select: { invoiceNumber: true, customer: { select: { legalName: true } } } } } }
      },
      orderBy: { date: 'desc' }
    });
  }

  async createBatch(tenantId: string, bankAccountId: string, transactions: any[]) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId }
    });
    if (!account) throw new BadRequestException('Account not found');

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

    // Update Balance
    const allTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId } });
    const balance = allTxs.reduce((acc, t) => acc + t.amount, 0);
    await this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { balance } });

    return created;
  }

  async getSuggestions(tenantId: string, transactionId: string) {
     const transaction = await this.prisma.bankTransaction.findUnique({
       where: { id: transactionId }
     });
     if (!transaction) return [];

     if (transaction.type === 'IN') {
        const invoices = await this.prisma.invoice.findMany({
           where: {
              tenantId,
              status: { in: ['TIMBRADA', 'DRAFT'] },
              total: transaction.amount
           },
           include: { customer: true }
        });

        // == SCORING ALGORITHM ==
        const txContext = `${transaction.description || ''} ${transaction.reference || ''}`.toUpperCase();

        const scoredInvoices = invoices.map(inv => {
            let score = 10; // Empate por base numérica

            const isFolioMatch = inv.invoiceNumber && txContext.includes(inv.invoiceNumber.toUpperCase());
            const isNameMatch = inv.customer.legalName && txContext.includes(inv.customer.legalName.toUpperCase());
            
            // Heurística de prefijos comunes si el cliente escribe variaciones de la factura
            const hasFacturaKeyword = txContext.includes('FAC') || txContext.includes('FACTURA');

            if (isFolioMatch) score += 100;
            if (isNameMatch) score += 50;
            if (score === 10 && hasFacturaKeyword) score += 5; // Un poco más relevante si menciona factura pero no halló el número exacto

            return { ...inv, matchScore: score };
        });

        // Ordenar de mayor a menor puntuación
        return scoredInvoices.sort((a, b) => b.matchScore - a.matchScore);
     }

     return [];
  }

  async reconcileInvoice(tenantId: string, transactionId: string, invoiceId: string) {
    const transaction = await this.prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      include: { bankAccount: true }
    });

    if (!transaction || transaction.bankAccount.tenantId !== tenantId) {
      throw new BadRequestException('Unauthorized');
    }

    if (transaction.reconciled) {
      throw new BadRequestException('Ya conciliada');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId }
    });
    
    if (!invoice) throw new BadRequestException('Factura Invalida');

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

  async moveTransaction(tenantId: string, transactionId: string, targetBankAccountId: string) {
    const tx = await this.prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      include: { bankAccount: true }
    });

    if (!tx || tx.bankAccount.tenantId !== tenantId) {
      throw new BadRequestException('Transacción no encontrada o no autorizada');
    }

    const targetAccount = await this.prisma.bankAccount.findFirst({
      where: { id: targetBankAccountId, tenantId }
    });

    if (!targetAccount) {
       throw new BadRequestException('La bóveda destino no pertenece a tu cuenta o no existe');
    }

    const sourceBankAccountId = tx.bankAccountId;
    if (sourceBankAccountId === targetBankAccountId) {
       return { success: true };
    }

    // Move transaction
    await this.prisma.bankTransaction.update({
       where: { id: transactionId },
       data: { bankAccountId: targetBankAccountId }
    });

    // Update balances of both accounts
    const allSourceTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId: sourceBankAccountId } });
    const balanceSource = allSourceTxs.reduce((acc, t) => acc + t.amount, 0);
    await this.prisma.bankAccount.update({ where: { id: sourceBankAccountId }, data: { balance: balanceSource } });

    const allTargetTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId: targetBankAccountId } });
    const balanceTarget = allTargetTxs.reduce((acc, t) => acc + t.amount, 0);
    await this.prisma.bankAccount.update({ where: { id: targetBankAccountId }, data: { balance: balanceTarget } });

    return { success: true };
  }

  async deleteTransaction(tenantId: string, transactionId: string) {
    const tx = await this.prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      include: { bankAccount: true }
    });

    if (!tx || tx.bankAccount.tenantId !== tenantId) {
      throw new BadRequestException('Transacción no encontrada o no autorizada');
    }

    if (tx.reconciled) {
      throw new BadRequestException('No puedes eliminar una transacción que ya está conciliada. Desvincúlala primero.');
    }

    const bankAccountId = tx.bankAccountId;

    await this.prisma.bankTransaction.delete({
      where: { id: transactionId }
    });

    // Update Balance
    const allTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId } });
    const balance = allTxs.reduce((acc, t) => acc + t.amount, 0);
    await this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { balance } });

    return { success: true };
  }
}
