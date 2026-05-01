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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const xml_generator_service_1 = require("../cfdi/xml-generator/xml-generator.service");
const pac_service_1 = require("../cfdi/pac/pac.service");
let InvoicesService = class InvoicesService {
    prisma;
    xmlGenerator;
    pacService;
    constructor(prisma, xmlGenerator, pacService) {
        this.prisma = prisma;
        this.xmlGenerator = xmlGenerator;
        this.pacService = pacService;
    }
    async create(createInvoiceDto) {
        let { tenantId, customerId, paymentMethod, paymentForm, cfdiUse, items, currency, exchangeRate } = createInvoiceDto;
        let tenantObj;
        if (!tenantId) {
            tenantObj = await this.prisma.tenant.findFirst();
            if (!tenantObj)
                throw new common_1.BadRequestException('El sistema no tiene Empresa configurada.');
            tenantId = tenantObj.id;
        }
        else {
            tenantObj = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenantObj)
                throw new common_1.NotFoundException('Empresa no encontrada.');
        }
        const isDraft = createInvoiceDto.status === 'DRAFT';
        if (tenantObj.subscriptionEndsAt && new Date() > new Date(tenantObj.subscriptionEndsAt)) {
            throw new common_1.BadRequestException('Tu periodo de prueba o suscripción ha expirado. Por favor, realiza Upgrade de tu plan para seguir facturando.');
        }
        if (!isDraft && tenantObj.availableStamps !== -1) {
            if (tenantObj.availableStamps <= 0) {
                throw new common_1.BadRequestException('Límite de Timbres Agotado. Por favor adquiera más timbres o mejore su plan.');
            }
        }
        let taxProfile = await this.prisma.taxProfile.findFirst({
            where: { tenantId }
        });
        if (!taxProfile) {
            taxProfile = await this.prisma.taxProfile.create({
                data: {
                    tenantId,
                    rfc: 'XAXX010101000',
                    legalName: 'Empresa Emisora Automática S.A. de C.V.',
                    taxRegime: '601',
                    zipCode: '00000',
                }
            });
        }
        const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer)
            throw new common_1.NotFoundException('Cliente receptor no encontrado');
        let subtotal = 0;
        let taxTotal = 0;
        const invoiceItemsData = items.map((item) => {
            const discount = item.discount || 0;
            const amount = (item.quantity * item.unitPrice) - discount;
            const taxes = amount * item.taxRate;
            subtotal += amount;
            taxTotal += taxes;
            return {
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: discount,
                taxRate: item.taxRate,
                total: amount + taxes
            };
        });
        const total = subtotal + taxTotal;
        let invoiceNumber = createInvoiceDto.invoiceNumber;
        if (!invoiceNumber || invoiceNumber.trim() === '') {
            const series = await this.prisma.invoiceSeries.findFirst({
                where: { tenantId, type: 'INVOICE', isDefault: true }
            });
            if (series) {
                invoiceNumber = `${series.prefix}${series.nextFolio}`;
                await this.prisma.invoiceSeries.update({
                    where: { id: series.id },
                    data: { nextFolio: series.nextFolio + 1 }
                });
            }
            else {
                invoiceNumber = `FAC-${Date.now().toString().slice(-6)}`;
            }
        }
        const partialInvoice = {
            tenantId,
            customerId,
            invoiceNumber,
            date: new Date(),
            paymentMethod,
            paymentForm,
            cfdiUse,
            currency,
            exchangeRate,
            subtotal,
            taxTotal,
            total,
            customer,
            items: invoiceItemsData
        };
        let satUuid = null;
        let xmlContent = null;
        if (!isDraft) {
            const { xml } = await this.xmlGenerator.generate(partialInvoice, taxProfile);
            const pacResult = await this.pacService.stampXml(Buffer.from(xml).toString('base64'), 'SANDBOX');
            satUuid = pacResult.satUuid;
            xmlContent = pacResult.stampedXml;
        }
        const [invoice] = await this.prisma.$transaction([
            this.prisma.invoice.create({
                data: {
                    tenantId,
                    taxProfileId: taxProfile.id,
                    customerId,
                    invoiceNumber,
                    status: createInvoiceDto.status || 'TIMBRADA',
                    satUuid,
                    paymentMethod,
                    paymentForm,
                    cfdiUse,
                    currency: currency || 'MXN',
                    exchangeRate: exchangeRate || 1.0,
                    subtotal,
                    taxTotal,
                    total,
                    xmlContent,
                    cashShiftId: createInvoiceDto.cashShiftId,
                    customFields: createInvoiceDto.customFields,
                    items: {
                        create: invoiceItemsData
                    }
                },
                include: {
                    items: true,
                    customer: true,
                    taxProfile: true
                }
            }),
            ...(!isDraft && tenantObj.availableStamps !== -1 ? [
                this.prisma.tenant.update({
                    where: { id: tenantId },
                    data: { availableStamps: { decrement: 1 } }
                })
            ] : [])
        ]);
        return invoice;
    }
    async findAll(tenantId) {
        let whereFilter = {};
        if (tenantId && tenantId !== 'demo-tenant') {
            whereFilter = { tenantId };
        }
        return this.prisma.invoice.findMany({
            where: whereFilter,
            include: { customer: true, items: true, taxProfile: true, payments: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getStats(tenantId) {
        let whereFilter = {};
        if (tenantId && tenantId !== 'demo-tenant') {
            whereFilter = { tenantId };
        }
        const allInvoices = await this.prisma.invoice.findMany({
            where: whereFilter,
            include: { payments: true }
        });
        const allExpenses = await this.prisma.expense.findMany({
            where: whereFilter
        });
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const totalInvoices = allInvoices.filter(i => i.status !== 'CANCELADA').length;
        const cancelledInvoices = allInvoices.filter(i => i.status === 'CANCELADA').length;
        let totalRevenue = 0;
        let totalTaxes = 0;
        let accountsReceivable = 0;
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        let totalExpenses = 0;
        let thisMonthExpenses = 0;
        for (const inv of allInvoices) {
            if (inv.status !== 'CANCELADA') {
                totalRevenue += inv.subtotal;
                totalTaxes += inv.taxTotal;
                const invDate = new Date(inv.createdAt);
                const invMonth = invDate.getMonth();
                const invYear = invDate.getFullYear();
                if (invYear === currentYear && invMonth === currentMonth) {
                    thisMonthRevenue += inv.total;
                }
                else if (invYear === currentYear && invMonth === currentMonth - 1) {
                    lastMonthRevenue += inv.total;
                }
                if (inv.status !== 'PAID') {
                    const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
                    accountsReceivable += (inv.total - paid);
                }
            }
        }
        for (const exp of allExpenses) {
            if (exp.status !== 'CANCELADA') {
                totalExpenses += exp.total;
                const expDate = new Date(exp.date);
                const expMonth = expDate.getMonth();
                const expYear = expDate.getFullYear();
                if (expYear === currentYear && expMonth === currentMonth) {
                    thisMonthExpenses += exp.total;
                }
            }
        }
        const tenant = (tenantId && tenantId !== 'demo-tenant') ? await this.prisma.tenant.findUnique({ where: { id: tenantId } }) : await this.prisma.tenant.findFirst();
        const taxProfile = (tenantId && tenantId !== 'demo-tenant') ? await this.prisma.taxProfile.findFirst({ where: { tenantId } }) : null;
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            let m = currentMonth - i;
            let y = currentYear;
            if (m < 0) {
                m += 12;
                y -= 1;
            }
            let sum = 0;
            let sumCred = 0;
            allInvoices.forEach(inv => {
                if (inv.status !== 'CANCELADA') {
                    const idt = new Date(inv.createdAt);
                    if (idt.getMonth() === m && idt.getFullYear() === y) {
                        if (inv.paymentMethod === '99')
                            sumCred += inv.total;
                        else
                            sum += inv.total;
                    }
                }
            });
            chartData.push({ name: monthNames[m], efectivo: sum, credito: sumCred });
        }
        return {
            totalInvoices,
            cancelledInvoices,
            totalRevenue,
            totalTaxes,
            accountsReceivable,
            thisMonthRevenue,
            lastMonthRevenue,
            totalExpenses,
            thisMonthExpenses,
            chartData,
            subscriptionTier: tenant?.subscriptionTier || 'EMPRENDEDOR',
            availableStamps: tenant?.availableStamps || 0,
            hasExpenseControl: tenant?.hasExpenseControl || false,
            subscriptionEndsAt: tenant?.subscriptionEndsAt || null,
            tenantTradeName: tenant?.tradeName || tenant?.name || 'Compañía Default',
            tenantLogoUrl: taxProfile?.logoUrl || null,
            recentInvoices: await this.prisma.invoice.findMany({
                take: 5,
                where: {
                    status: 'TIMBRADA',
                    ...whereFilter
                },
                orderBy: { createdAt: 'desc' },
                include: { customer: true, payments: true }
            }),
            recentExpenses: await this.prisma.expense.findMany({
                take: 5,
                where: whereFilter,
                orderBy: { createdAt: 'desc' },
                include: { supplier: true }
            })
        };
    }
    async findOne(id) {
        const inv = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true,
                customer: true,
                taxProfile: true,
                payments: true
            }
        });
        if (!inv)
            throw new common_1.NotFoundException('Factura no encontrada');
        return inv;
    }
    async registerPayment(id, payload) {
        const invoice = await this.findOne(id);
        if (invoice.status === 'CANCELADA') {
            throw new common_1.BadRequestException('No se pueden registrar pagos a una factura cancelada.');
        }
        const currentPaid = invoice.payments ? invoice.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
        const newTotalPaid = currentPaid + payload.amount;
        const isPaidFully = (invoice.total - newTotalPaid) <= 0.01;
        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    invoiceId: id,
                    amount: payload.amount,
                    paymentDate: new Date(payload.paymentDate),
                    paymentMethod: payload.paymentMethod || '03',
                    reference: payload.reference,
                    notes: payload.notes
                }
            });
            if (isPaidFully && invoice.status !== 'PAID') {
                await tx.invoice.update({
                    where: { id },
                    data: { status: 'PAID' }
                });
            }
            return payment;
        });
        return result;
    }
    async cancel(id) {
        const invoice = await this.findOne(id);
        if (invoice.status === 'CANCELADA') {
            throw new common_1.BadRequestException('La factura ya está cancelada');
        }
        return this.prisma.invoice.update({
            where: { id },
            data: { status: 'CANCELADA' }
        });
    }
    async cancelFiscal(id, motive, substitutionUuid) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { taxProfile: true }
        });
        if (!invoice)
            throw new common_1.BadRequestException('Factura no encontrada');
        if (invoice.status === 'CANCELADA')
            throw new common_1.BadRequestException('La factura ya está cancelada');
        if (invoice.status === 'DRAFT' || !invoice.satUuid) {
            return this.cancel(id);
        }
        const tp = invoice.taxProfile;
        let b64Cer = tp?.cerBase64;
        let b64Key = tp?.keyBase64;
        let csdPassword = tp?.keyPassword;
        let rfcEmisor = tp?.rfc;
        const fs = require('fs');
        const path = require('path');
        if (!b64Cer || !b64Key || !csdPassword) {
            let cerPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.cer');
            let keyPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.key');
            if (fs.existsSync(cerPath) && fs.existsSync(keyPath)) {
                b64Cer = fs.readFileSync(cerPath).toString('base64');
                b64Key = fs.readFileSync(keyPath).toString('base64');
                csdPassword = '12345678a';
                rfcEmisor = 'EKU9003173C9';
            }
            else {
                throw new common_1.BadRequestException('El perfil fiscal no tiene sus archivos CSD configurados y no hay archivos de prueba disponibles.');
            }
        }
        const cleanBase64 = (str) => str ? str.replace(/^data:[^;]+;base64,/, "") : "";
        const acuse = await this.pacService.cancelCfdi({
            uuid: invoice.satUuid,
            passwordCsd: csdPassword,
            rfc: rfcEmisor || 'EKU9003173C9',
            b64Cer: cleanBase64(b64Cer),
            b64Key: cleanBase64(b64Key),
            motivo: motive,
            folioSustitucion: substitutionUuid
        }, 'SANDBOX');
        return this.prisma.invoice.update({
            where: { id },
            data: { status: 'CANCELADA' }
        });
    }
    async stamp(id) {
        const invoice = await this.findOne(id);
        if (invoice.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Solo se pueden timbrar facturas en borrador.');
        }
        const tenantObj = await this.prisma.tenant.findUnique({ where: { id: invoice.tenantId } });
        if (!tenantObj)
            throw new common_1.NotFoundException('Empresa no encontrada.');
        if (tenantObj.subscriptionEndsAt && new Date() > new Date(tenantObj.subscriptionEndsAt)) {
            throw new common_1.BadRequestException('Tu periodo de prueba o suscripción ha expirado. Por favor, realiza Upgrade de tu plan para seguir facturando.');
        }
        if (tenantObj.availableStamps !== -1 && tenantObj.availableStamps <= 0) {
            throw new common_1.BadRequestException('Límite de Timbres Agotado. Por favor adquiera más timbres o mejore su plan.');
        }
        const taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId: invoice.tenantId } });
        const { xml } = await this.xmlGenerator.generate(invoice, taxProfile);
        const pacResult = await this.pacService.stampXml(Buffer.from(xml).toString('base64'), 'SANDBOX');
        const [updatedInvoice] = await this.prisma.$transaction([
            this.prisma.invoice.update({
                where: { id },
                data: {
                    status: 'TIMBRADA',
                    satUuid: pacResult.satUuid,
                    xmlContent: pacResult.stampedXml
                }
            }),
            ...(tenantObj.availableStamps !== -1 ? [
                this.prisma.tenant.update({
                    where: { id: invoice.tenantId },
                    data: { availableStamps: { decrement: 1 } }
                })
            ] : [])
        ]);
        return updatedInvoice;
    }
    async sendWhatsapp(id, phone) {
        const invoice = await this.findOne(id);
        if (!invoice)
            throw new common_1.NotFoundException('Factura no encontrada');
        const amountStr = invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 });
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10)
            formattedPhone = `521${formattedPhone}`;
        const tenantObj = await this.prisma.tenant.findUnique({ where: { id: invoice.tenantId } });
        const emitterName = tenantObj?.tradeName || tenantObj?.name || 'FacturaPro';
        const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3005';
        const pdfUrl = `${baseUrl}/invoices/${invoice.id}/pdf`;
        const msg = `🧾 *NUEVA FACTURA DISPONIBLE*\n\nHola. Te informamos que *${emitterName}* ha emitido un nuevo comprobante fiscal a tu nombre.\n\n*Folio:* ${invoice.invoiceNumber}\n*Monto Total:* $${amountStr} MXN\n*Estado:* ${invoice.status === 'PAID' ? '✅ Pagada' : '⏳ Pendiente'}\n\n📄 *Descargar PDF/XML:*\n${pdfUrl}\n\n_Este es un sistema automático de FacturaPro SaaS. Por favor no respondas a este mensaje._`;
        try {
            const omniUrl = process.env.OMNICHAT_API_URL || 'http://127.0.0.1:3002';
            await fetch(`${omniUrl}/api/v1/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer sk_24af03088b47aac20bae7b1df07f8399',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: formattedPhone, text: msg })
            });
            return { success: true, message: 'WhatsApp enviado a la cola correctamente' };
        }
        catch (e) {
            throw new common_1.BadRequestException('Fallo al conectar con el motor de envíos');
        }
    }
    async getArReport(tenantId) {
        let whereFilter = {};
        if (tenantId && tenantId !== 'demo-tenant') {
            whereFilter = { tenantId };
        }
        const rawPayments = await this.prisma.payment.findMany({
            where: {
                invoice: whereFilter
            },
            include: {
                invoice: {
                    include: { customer: true }
                }
            },
            orderBy: { paymentDate: 'desc' }
        });
        const allInvoices = await this.prisma.invoice.findMany({
            where: whereFilter,
            include: { payments: true, customer: true }
        });
        let totalAccountsReceivable = 0;
        const unpaidInvoices = [];
        const thisMonthPayments = rawPayments.filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth());
        const monthlyCollected = thisMonthPayments.reduce((acc, p) => acc + p.amount, 0);
        for (const inv of allInvoices) {
            if (inv.status !== 'CANCELADA' && inv.status !== 'PAID') {
                const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
                const due = inv.total - paid;
                if (due > 0.01) {
                    totalAccountsReceivable += due;
                    unpaidInvoices.push({
                        ...inv,
                        balanceDue: due
                    });
                }
            }
        }
        return {
            totalAccountsReceivable,
            activeUnpaidInvoices: unpaidInvoices.length,
            monthlyCollected,
            unpaidInvoices: unpaidInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            paymentHistory: rawPayments.map(p => ({
                id: p.id,
                amount: p.amount,
                paymentDate: p.paymentDate,
                paymentMethod: p.paymentMethod,
                reference: p.reference,
                invoiceNumber: p.invoice.invoiceNumber,
                invoiceId: p.invoice.id,
                customerName: p.invoice.customer?.legalName || 'N/A'
            }))
        };
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        xml_generator_service_1.XmlGeneratorService,
        pac_service_1.PacService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map