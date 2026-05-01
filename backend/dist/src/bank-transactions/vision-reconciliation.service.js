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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var VisionReconciliationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bank_transactions_service_1 = require("./bank-transactions.service");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
let VisionReconciliationService = VisionReconciliationService_1 = class VisionReconciliationService {
    prisma;
    bankTxService;
    configService;
    openai = null;
    logger = new common_1.Logger(VisionReconciliationService_1.name);
    constructor(prisma, bankTxService, configService) {
        this.prisma = prisma;
        this.bankTxService = bankTxService;
        this.configService = configService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new openai_1.default({ apiKey });
        }
        else {
            this.logger.warn('OPENAI_API_KEY no detectada. Julio Vision estará inactivo.');
        }
    }
    async processReceipt(tenantId, bankAccountId, file) {
        if (!this.openai) {
            throw new common_1.BadRequestException('El motor de Inteligencia Artificial (Julio Vision) no está configurado (Falta OPENAI_API_KEY).');
        }
        const account = await this.prisma.bankAccount.findFirst({
            where: { id: bankAccountId, tenantId }
        });
        if (!account)
            throw new common_1.BadRequestException('Cuenta bancaria no encontrada');
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
                temperature: 0.1,
            });
            const responseText = response.choices[0]?.message?.content || '';
            const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const extracted = JSON.parse(cleaned);
            this.logger.log(`📄 Datos extraídos: $${extracted.amount} MXN, Ref: ${extracted.reference}`);
            if (!extracted.amount || isNaN(parseFloat(extracted.amount))) {
                throw new common_1.BadRequestException('Julio no pudo detectar el monto en el comprobante.');
            }
            let finalBankAccountId = bankAccountId;
            let targetAccountName = account.name;
            let rerouted = false;
            if (extracted.bankName && typeof extracted.bankName === 'string' && extracted.bankName.trim().length > 2) {
                const bankQuery = extracted.bankName.trim();
                const matchedBank = await this.prisma.bankAccount.findFirst({
                    where: { tenantId, name: { contains: bankQuery, mode: 'insensitive' } }
                });
                if (matchedBank) {
                    if (matchedBank.id !== bankAccountId) {
                        finalBankAccountId = matchedBank.id;
                        targetAccountName = matchedBank.name;
                        rerouted = true;
                        this.logger.log(`🔄 Comprobante re-enrutado a bóveda existente: ${targetAccountName}`);
                    }
                }
                else {
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
            const amount = parseFloat(extracted.amount);
            const possibleInvoices = await this.prisma.invoice.findMany({
                where: {
                    tenantId,
                    status: { in: ['TIMBRADA', 'DRAFT'] },
                    total: amount
                },
                include: { customer: true }
            });
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
            const allTxs = await this.prisma.bankTransaction.findMany({ where: { bankAccountId: finalBankAccountId } });
            const balance = allTxs.reduce((acc, t) => acc + t.amount, 0);
            await this.prisma.bankAccount.update({ where: { id: finalBankAccountId }, data: { balance } });
            let reconciliationStatus = 'PENDING';
            let matchedInvoice = null;
            if (possibleInvoices.length > 0) {
                let bestMatch = null;
                let bestScore = 0;
                for (const inv of possibleInvoices) {
                    let score = 10;
                    const refUpper = (extracted.reference || '').toUpperCase();
                    const descUpper = (`${extracted.senderName} ${extracted.invoiceFolio}`).toUpperCase();
                    const fullContext = `${refUpper} ${descUpper}`;
                    if (extracted.invoiceFolio && fullContext.includes(inv.invoiceNumber.toUpperCase())) {
                        score += 100;
                    }
                    else if (inv.invoiceNumber && fullContext.includes(inv.invoiceNumber.toUpperCase())) {
                        score += 100;
                    }
                    if (inv.customer.legalName && fullContext.includes(inv.customer.legalName.toUpperCase())) {
                        score += 50;
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = inv;
                    }
                }
                if (bestMatch && bestScore >= 50) {
                    matchedInvoice = bestMatch;
                    await this.bankTxService.reconcileInvoice(tenantId, tx.id, matchedInvoice.id);
                    reconciliationStatus = 'AUTO_RECONCILED';
                    this.logger.log(`✅ Auto-conciliado con factura ${matchedInvoice.invoiceNumber} (Score: ${bestScore})`);
                }
                else if (possibleInvoices.length === 1 && bestScore === 10) {
                    matchedInvoice = possibleInvoices[0];
                    await this.bankTxService.reconcileInvoice(tenantId, tx.id, matchedInvoice.id);
                    reconciliationStatus = 'AUTO_RECONCILED';
                    this.logger.log(`✅ Auto-conciliado matemáticamente (Fallback único) con ${matchedInvoice.invoiceNumber}`);
                }
                else {
                    reconciliationStatus = 'MULTIPLE_MATCHES';
                    this.logger.warn(`🤔 Múltiples empates sin contexto clave (Matches: ${possibleInvoices.length})`);
                }
            }
            else {
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
        }
        catch (error) {
            this.logger.error('Error procesando imagen', error);
            throw new common_1.BadRequestException('Error interno al analizar el comprobante con la Inteligencia Artificial.');
        }
    }
};
exports.VisionReconciliationService = VisionReconciliationService;
exports.VisionReconciliationService = VisionReconciliationService = VisionReconciliationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bank_transactions_service_1.BankTransactionsService,
        config_1.ConfigService])
], VisionReconciliationService);
//# sourceMappingURL=vision-reconciliation.service.js.map