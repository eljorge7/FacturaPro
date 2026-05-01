import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BankTransactionsService } from './bank-transactions.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class VisionReconciliationService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(VisionReconciliationService.name);

  constructor(
    private prisma: PrismaService,
    private bankTxService: BankTransactionsService,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
        this.logger.warn('OPENAI_API_KEY no detectada. Julio Vision estará inactivo.');
    }
  }

  async processReceipt(tenantId: string, bankAccountId: string, file: Express.Multer.File) {
    if (!this.openai) {
      throw new BadRequestException('El motor de Inteligencia Artificial (Julio Vision) no está configurado (Falta OPENAI_API_KEY).');
    }

    // Verify account
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId }
    });
    if (!account) throw new BadRequestException('Cuenta bancaria no encontrada');

    // Convert file to base64
    const base64Image = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    try {
      this.logger.log(`🤖 Julio Vision procesando imagen de ${file.size} bytes...`);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres Julio, Analista Financiero Senior de MAJIA OS. Tu trabajo es leer capturas de pantalla de comprobantes de pago bancarios (Spei, BBVA, Citibanamex, etc.) y extraer los datos de la transferencia en un formato JSON estricto.
            Debes extraer:
            - "amount": Número flotante del monto total transferido (ej. 1500.50).
            - "reference": Cadena de referencia o concepto del pago. Si no hay, usa "".
            - "date": Fecha del pago en formato YYYY-MM-DD. Si no hay día exacto, asume la fecha visible más reciente.
            - "senderName": Nombre de quien envía el pago o beneficiario.
            - "bankName": Nombre del banco (ej. "BBVA", "Banamex").
            - "invoiceFolio": Opcional. Si observas un texto parecido a un número o clave de factura (ej. "FAC-003", "F-102", "Factura 1109"), extráelo. Si no, usa "".
            
            Retorna EXCLUSIVAMENTE un JSON limpio y sin comillas invertidas ni explicaciones.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analiza este comprobante bancario:' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1, // Baja temperatura para alta precisión
      });

      const responseText = response.choices[0]?.message?.content || '';
      
      // Limpiar markdown del JSON (si Julio manda ```json ... ```)
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extracted = JSON.parse(cleaned);

      this.logger.log(`📄 Datos extraídos: $${extracted.amount} MXN, Ref: ${extracted.reference}`);

      if (!extracted.amount || isNaN(parseFloat(extracted.amount))) {
          throw new BadRequestException('Julio no pudo detectar el monto en el comprobante.');
      }

      // == 🧠 MAGIA: ENRUTAMIENTO INTELIGENTE DE BÓVEDA ==
      let finalBankAccountId = bankAccountId;
      let targetAccountName = account.name;
      let rerouted = false;

      if (extracted.bankName && typeof extracted.bankName === 'string' && extracted.bankName.trim().length > 2) {
          const bankQuery = extracted.bankName.trim();
          
          const matchedBank = await this.prisma.bankAccount.findFirst({
              where: { tenantId, name: { contains: bankQuery, mode: 'insensitive' } }
          });

          if (matchedBank) {
              // Bóveda encontrada
              if (matchedBank.id !== bankAccountId) {
                  finalBankAccountId = matchedBank.id;
                  targetAccountName = matchedBank.name;
                  rerouted = true;
                  this.logger.log(`🔄 Comprobante re-enrutado a bóveda existente: ${targetAccountName}`);
              }
          } else {
              // Bóveda inexistente... Julio la creará al vuelo.
              const newAccName = `Bóveda ${bankQuery}`;
              const newBank = await this.prisma.bankAccount.create({
                  data: { tenantId, name: newAccName, currency: 'MXN' }
              });
              finalBankAccountId = newBank.id;
              targetAccountName = newAccName;
              rerouted = true;
              this.logger.log(`✨ Nueva bóveda creada inteligentemente por IA: ${newAccName}`);
          }
      }

      // Buscar factura emparejable
      const amount = parseFloat(extracted.amount);
      const possibleInvoices = await this.prisma.invoice.findMany({
         where: {
            tenantId,
            status: { in: ['TIMBRADA', 'DRAFT'] },
            total: amount
         },
         include: { customer: true }
      });

      // Crear transacción genérica en base de datos
      const tx = await this.prisma.bankTransaction.create({
          data: {
              bankAccountId: finalBankAccountId,
              date: new Date(extracted.date || new Date()),
              amount: amount,
              description: `Depósito ${extracted.bankName || 'Bancario'} - ${extracted.senderName || 'Desconocido'}`,
              reference: extracted.reference || 'SPEI/TRANSF',
              type: 'IN',
              reconciled: false
          }
      });

      // Update Balance (Simplified sum directly via native DB agg could be better, reuse logic)
      const allTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId: finalBankAccountId } });
      const balance = allTxs.reduce((acc, t) => acc + t.amount, 0);
      await this.prisma.bankAccount.update({ where: { id: finalBankAccountId }, data: { balance } });

      let reconciliationStatus = 'PENDING';
      let matchedInvoice = null;

      // == 🎯 TIE-BREAKING HEURÍSTICO ==
      // Si hay múltiples (o 1) facturas con el mismo monto, usamos inteligencia textual para decidir la ganadora.
      if (possibleInvoices.length > 0) {
          let bestMatch = null;
          let bestScore = 0;

          for (const inv of possibleInvoices) {
              let score = 10; // Base score por empate numérico
              const refUpper = (extracted.reference || '').toUpperCase();
              const descUpper = (`${extracted.senderName} ${extracted.invoiceFolio}`).toUpperCase();
              const fullContext = `${refUpper} ${descUpper}`;

              // Match de Folio Exacto (Tiro directo = 100 ptos)
              if (extracted.invoiceFolio && fullContext.includes(inv.invoiceNumber.toUpperCase())) {
                  score += 100;
              }
              else if (inv.invoiceNumber && fullContext.includes(inv.invoiceNumber.toUpperCase())) {
                  score += 100;
              }
              
              // Match por Nombre de Relación Comercial (50 ptos)
              if (inv.customer.legalName && fullContext.includes(inv.customer.legalName.toUpperCase())) {
                  score += 50;
              }

              if (score > bestScore) {
                  bestScore = score;
                  bestMatch = inv;
              }
          }

          if (bestMatch && bestScore >= 50) {
              // Superó el umbral de certeza inteligente
              matchedInvoice = bestMatch;
              await this.bankTxService.reconcileInvoice(tenantId, tx.id, matchedInvoice.id);
              reconciliationStatus = 'AUTO_RECONCILED';
              this.logger.log(`✅ Auto-conciliado con factura ${matchedInvoice.invoiceNumber} (Score: ${bestScore})`);
          } else if (possibleInvoices.length === 1 && bestScore === 10) {
              // Sólo hay 1 factura pendiente por ese monto, asumimos que es correcta por descarte matemático.
              matchedInvoice = possibleInvoices[0];
              await this.bankTxService.reconcileInvoice(tenantId, tx.id, matchedInvoice.id);
              reconciliationStatus = 'AUTO_RECONCILED';
              this.logger.log(`✅ Auto-conciliado matemáticamente (Fallback único) con ${matchedInvoice.invoiceNumber}`);
          } else {
              reconciliationStatus = 'MULTIPLE_MATCHES';
              this.logger.warn(`🤔 Múltiples empates sin contexto clave (Matches: ${possibleInvoices.length})`);
          }
      } else {
          reconciliationStatus = 'NO_MATCH_FOUND';
      }

      return {
          success: true,
          extracted,
          transactionId: tx.id,
          reconciliationStatus,
          targetAccountId: finalBankAccountId,
          rerouted,
          targetAccountName,
          matchedInvoice: matchedInvoice ? {
              id: matchedInvoice.id,
              invoiceNumber: matchedInvoice.invoiceNumber,
              customer: matchedInvoice.customer.legalName
          } : null,
          candidates: possibleInvoices.length > 1 ? possibleInvoices.length : 0
      };

    } catch (error) {
      this.logger.error('Error procesando imagen', error);
      throw new BadRequestException('Error interno al analizar el comprobante con la Inteligencia Artificial.');
    }
  }
}
