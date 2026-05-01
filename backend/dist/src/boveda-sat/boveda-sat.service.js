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
var BovedaSatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BovedaSatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sat_ws_descarga_masiva_1 = require("@nodecfdi/sat-ws-descarga-masiva");
const xml2js_1 = require("xml2js");
const JSZip = require('jszip');
let BovedaSatService = BovedaSatService_1 = class BovedaSatService {
    prisma;
    logger = new common_1.Logger(BovedaSatService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    cleanBase64(str) {
        return str ? str.replace(/^data:[^;]+;base64,/, "") : "";
    }
    async getSatService(tenantId) {
        const profile = await this.prisma.taxProfile.findFirst({ where: { tenantId } });
        if (!profile || !profile.fielCerBase64 || !profile.fielKeyBase64 || !profile.fielPassword) {
            throw new common_1.BadRequestException("El perfil fiscal no tiene certificados de Firma Electrónica (FIEL) configurados para Bóveda SAT.");
        }
        const b64Cer = this.cleanBase64(profile.fielCerBase64);
        const b64Key = this.cleanBase64(profile.fielKeyBase64);
        const cerPem = `-----BEGIN CERTIFICATE-----\n${(b64Cer.match(/.{1,64}/g) || []).join('\n')}\n-----END CERTIFICATE-----`;
        const keyPem = `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${(b64Key.match(/.{1,64}/g) || []).join('\n')}\n-----END ENCRYPTED PRIVATE KEY-----`;
        try {
            const fiel = sat_ws_descarga_masiva_1.Fiel.create(cerPem, keyPem, profile.fielPassword);
            const requestBuilder = new sat_ws_descarga_masiva_1.FielRequestBuilder(fiel);
            const webClient = new sat_ws_descarga_masiva_1.HttpsWebClient();
            const endpoints = sat_ws_descarga_masiva_1.ServiceEndpoints.cfdi();
            const service = new sat_ws_descarga_masiva_1.Service(requestBuilder, webClient, null, endpoints);
            return { service: service, profile };
        }
        catch (err) {
            throw new common_1.BadRequestException("Error al instanciar credenciales FIEL: " + err.message);
        }
    }
    async requestDownload(tenantId, period, type) {
        const { service, profile } = await this.getSatService(tenantId);
        try {
            this.logger.log(`Solicitando descarga SAT para RFC: ${profile.rfc} Periodo: ${period.start} a ${period.end}`);
            const startDateTime = sat_ws_descarga_masiva_1.DateTime.create(period.start + ' 00:00:00');
            const endDateTime = sat_ws_descarga_masiva_1.DateTime.create(period.end + ' 23:59:59');
            const queryPeriod = sat_ws_descarga_masiva_1.DateTimePeriod.create(startDateTime, endDateTime);
            const downloadType = new sat_ws_descarga_masiva_1.DownloadType(type === 'issued' ? 'issued' : 'received');
            const queryParameters = sat_ws_descarga_masiva_1.QueryParameters.create()
                .withPeriod(queryPeriod)
                .withDownloadType(downloadType)
                .withRequestType(new sat_ws_descarga_masiva_1.RequestType('xml'))
                .withDocumentStatus(new sat_ws_descarga_masiva_1.DocumentStatus('active'));
            const result = await service.query(queryParameters);
            if (!result.getStatus().isAccepted()) {
                throw new common_1.BadRequestException(`SAT rechazó la solicitud: ${result.getStatus().getMessage()}`);
            }
            const idSolicitud = result.getRequestId();
            if (!idSolicitud) {
                throw new common_1.BadRequestException("SAT no devolvió un Folio de Solicitud (Ticket ID) a pesar de haber aceptado la petición.");
            }
            await this.prisma.satDownloadRequest.upsert({
                where: { idSolicitud: idSolicitud },
                update: {
                    status: 'ACCEPTED',
                    message: result.getStatus().getMessage(),
                    requestType: type,
                    periodStart: new Date(period.start + 'T00:00:00Z'),
                    periodEnd: new Date(period.end + 'T23:59:59Z'),
                },
                create: {
                    tenantId,
                    taxProfileId: profile.id,
                    idSolicitud: idSolicitud,
                    status: 'ACCEPTED',
                    message: result.getStatus().getMessage(),
                    requestType: type,
                    periodStart: new Date(period.start + 'T00:00:00Z'),
                    periodEnd: new Date(period.end + 'T23:59:59Z'),
                }
            });
            return {
                idSolicitud: result.getRequestId(),
                status: 'ACCEPTED',
                message: result.getStatus().getMessage(),
                rfc: profile.rfc,
                period,
            };
        }
        catch (e) {
            this.logger.error("Error solicitando descarga masiva XML al SAT", e);
            let errorReason = e.message;
            if (e.message.includes("Invalid `this.prisma")) {
                const parts = e.message.split('\n');
                errorReason = "Prisma Error: " + parts[parts.length - 1];
            }
            throw new common_1.BadRequestException("Fallo en la comunicación con WebService del SAT:\n" + errorReason);
        }
    }
    async verifyDownload(tenantId, idSolicitud) {
        const { service } = await this.getSatService(tenantId);
        const verifyResult = await service.verify(idSolicitud);
        const resultStatus = verifyResult.getStatus();
        const st = resultStatus.isAccepted() ? 'ACCEPTED' : (resultStatus.isRejected ? (resultStatus.isRejected() ? 'REJECTED' : 'PENDING') : 'PENDING');
        const pacIds = verifyResult.getPackageIds().join(',');
        await this.prisma.satDownloadRequest.update({
            where: { idSolicitud },
            data: {
                status: st,
                message: resultStatus.getMessage(),
                packageIds: pacIds || null
            }
        });
        return {
            idSolicitud,
            status: st,
            statusCode: resultStatus.getValue ? resultStatus.getValue() : 0,
            message: resultStatus.getMessage(),
            paquetes: verifyResult.getPackageIds()
        };
    }
    async getRequests(tenantId) {
        return this.prisma.satDownloadRequest.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async downloadAndProcessPackage(tenantId, idPaquete) {
        try {
            const { service, profile } = await this.getSatService(tenantId);
            this.logger.log(`Descargando paquete XML: ${idPaquete}`);
            const downloadResult = await service.download(idPaquete);
            const pkgContent = downloadResult.getPackageContent ? downloadResult.getPackageContent() : downloadResult;
            const st = downloadResult.getStatus ? downloadResult.getStatus() : null;
            if (st && !st.isAccepted()) {
                throw new common_1.BadRequestException(`El SAT bloqueó o rechazó la descarga: ${st.getMessage()} (Cód: ${st.getCode()})`);
            }
            if (!pkgContent || pkgContent.length === 0) {
                throw new common_1.BadRequestException(`El paquete SAT fue descargado pero está vacío. Estado del SAT: ${st ? st.getMessage() : 'Desconocido'}`);
            }
            this.logger.log(`Paquete SAT obtenido: ${(pkgContent.length / 1024).toFixed(2)} KB.`);
            const zipInstance = await new JSZip().loadAsync(Buffer.from(pkgContent, 'base64'));
            let invoicesCreated = 0;
            let expensesCreated = 0;
            let duplicatesIgnored = 0;
            const filesList = Object.keys(zipInstance.files);
            this.logger.log(`Archivos encontrados en el ZIP: ${filesList.join(", ")}`);
            for (const [relativePath, zipEntryRaw] of Object.entries(zipInstance.files)) {
                const zipEntry = zipEntryRaw;
                if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.xml')) {
                    const xmlBuffer = await zipEntry.async('nodebuffer');
                    const xmlContent = xmlBuffer.toString('utf-8');
                    try {
                        const parsed = await (0, xml2js_1.parseStringPromise)(xmlContent);
                        const comprobante = parsed['cfdi:Comprobante'] || parsed['Comprobante'];
                        if (!comprobante)
                            continue;
                        const timbre = comprobante['cfdi:Complemento']?.[0]?.['tfd:TimbreFiscalDigital']?.[0]?.['$'] || {};
                        const uuid = timbre.UUID;
                        if (!uuid)
                            continue;
                        const existingExpense = await this.prisma.expense.findUnique({ where: { satUuid: uuid } });
                        const existingInvoice = await this.prisma.invoice.findUnique({ where: { satUuid: uuid } });
                        if (existingExpense || existingInvoice) {
                            duplicatesIgnored++;
                            continue;
                        }
                        const emisorNode = comprobante['cfdi:Emisor']?.[0]?.['$'] || {};
                        const receptorNode = comprobante['cfdi:Receptor']?.[0]?.['$'] || {};
                        const amountStr = comprobante['$']?.Total || "0";
                        const total = parseFloat(amountStr);
                        const isIngreso = receptorNode.Rfc?.toUpperCase() === profile.rfc.toUpperCase() ? false : true;
                        if (!isIngreso) {
                            let supplier = await this.prisma.supplier.findFirst({
                                where: { tenantId, rfc: emisorNode.Rfc }
                            });
                            if (!supplier) {
                                supplier = await this.prisma.supplier.create({
                                    data: {
                                        tenantId,
                                        rfc: emisorNode.Rfc,
                                        legalName: emisorNode.Nombre || "Proveedor SAT"
                                    }
                                });
                            }
                            const efoRecord = await this.prisma.efosRecord.findUnique({
                                where: { rfc: emisorNode.Rfc?.toUpperCase() || "" }
                            });
                            const isEfos = !!efoRecord;
                            if (isEfos) {
                                this.logger.warn(`¡ALERTA ROJA! Se identificó un proveedor EFOS (Art 69-B) al descargar: ${emisorNode.Rfc}`);
                            }
                            await this.prisma.expense.create({
                                data: {
                                    tenantId,
                                    supplierId: supplier.id,
                                    satUuid: uuid,
                                    total,
                                    amount: total,
                                    status: isEfos ? 'DRAFT-FRAUD' : 'DRAFT',
                                    xmlContent,
                                    description: isEfos ? `¡FRAUDE ART: 69-B! Factura Descargada de SAT Autómata (${uuid.split('-')[0]})` : `Factura Descargada de SAT Autómata (${uuid.split('-')[0]})`
                                }
                            });
                            expensesCreated++;
                        }
                        else {
                            let customer = await this.prisma.customer.findFirst({
                                where: { tenantId, rfc: receptorNode.Rfc }
                            });
                            if (!customer) {
                                customer = await this.prisma.customer.create({
                                    data: {
                                        tenantId,
                                        rfc: receptorNode.Rfc || "XAXX010101000",
                                        legalName: receptorNode.Nombre || "Cliente SAT (Importado)"
                                    }
                                });
                            }
                            const taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId } });
                            if (taxProfile) {
                                await this.prisma.invoice.create({
                                    data: {
                                        tenantId,
                                        taxProfileId: taxProfile.id,
                                        customerId: customer.id,
                                        satUuid: uuid,
                                        invoiceNumber: `SAT-${uuid.split('-')[0]}`,
                                        date: comprobante['$']?.Fecha ? new Date(comprobante['$'].Fecha) : new Date(),
                                        paymentMethod: comprobante['$']?.MetodoPago || "PUE",
                                        paymentForm: comprobante['$']?.FormaPago || "03",
                                        cfdiUse: receptorNode.UsoCFDI || "G03",
                                        subtotal: parseFloat(comprobante['$']?.SubTotal || "0"),
                                        taxTotal: parseFloat(comprobante['$']?.Total || "0") - parseFloat(comprobante['$']?.SubTotal || "0"),
                                        total: total,
                                        status: 'TIMBRADA',
                                        xmlContent
                                    }
                                });
                                invoicesCreated++;
                            }
                        }
                    }
                    catch (e) {
                        this.logger.warn(`Error parseando XML ${relativePath}: ${e.message}`);
                    }
                }
            }
            await this.prisma.satDownloadRequest.update({
                where: { idSolicitud: await this.findSolicitudIdByPackage(idPaquete) || "" },
                data: { status: 'SUCCESS' }
            }).catch(e => null);
            return {
                processStats: {
                    invoicesCreated,
                    expensesCreated,
                    duplicatesIgnored
                },
                packageSize: pkgContent.length,
                message: 'Buzón sincronizado en DRAFT.'
            };
        }
        catch (e) {
            this.logger.error("Error crítico descifrando paquete SAT", e);
            throw new common_1.BadRequestException("Fallo al descargar/procesar paquete: " + e.message);
        }
    }
    async findSolicitudIdByPackage(packageId) {
        const p = await this.prisma.satDownloadRequest.findFirst({
            where: { packageIds: { contains: packageId } }
        });
        return p?.idSolicitud;
    }
};
exports.BovedaSatService = BovedaSatService;
exports.BovedaSatService = BovedaSatService = BovedaSatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BovedaSatService);
//# sourceMappingURL=boveda-sat.service.js.map