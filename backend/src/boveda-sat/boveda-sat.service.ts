import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Fiel, HttpsWebClient, Service, ServiceEndpoints, QueryParameters, DateTimePeriod, DateTime, DownloadType, RequestType, FielRequestBuilder, DocumentStatus } from '@nodecfdi/sat-ws-descarga-masiva';
import { parseStringPromise } from 'xml2js';
const JSZip = require('jszip');

@Injectable()
export class BovedaSatService {
  private readonly logger = new Logger(BovedaSatService.name);

  constructor(private readonly prisma: PrismaService) {}

  private cleanBase64(str: string): string {
      return str ? str.replace(/^data:[^;]+;base64,/, "") : "";
  }

  private async getSatService(tenantId: string) {
      const profile = await this.prisma.taxProfile.findFirst({ where: { tenantId } });
      if (!profile || !profile.fielCerBase64 || !profile.fielKeyBase64 || !profile.fielPassword) {
        throw new BadRequestException("El perfil fiscal no tiene certificados de Firma Electrónica (FIEL) configurados para Bóveda SAT.");
      }

      const b64Cer = this.cleanBase64(profile.fielCerBase64);
      const b64Key = this.cleanBase64(profile.fielKeyBase64);
      const cerPem = `-----BEGIN CERTIFICATE-----\n${(b64Cer.match(/.{1,64}/g) || []).join('\n')}\n-----END CERTIFICATE-----`;
      const keyPem = `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${(b64Key.match(/.{1,64}/g) || []).join('\n')}\n-----END ENCRYPTED PRIVATE KEY-----`;

      try {
          const fiel = (Fiel as any).create(cerPem, keyPem, profile.fielPassword);
          const requestBuilder = new (FielRequestBuilder as any)(fiel);
          const webClient = new HttpsWebClient();
          const endpoints = ServiceEndpoints.cfdi(); 
          const service = new Service(requestBuilder, webClient as any, null, endpoints as any);
          return { service: service as any, profile };
      } catch (err) {
          throw new BadRequestException("Error al instanciar credenciales FIEL: " + err.message);
      }
  }

  /**
   * 1. Solicitar la Descarga al SAT (Crea la solicitud y nos da un IdSolicitud)
   */
  async requestDownload(tenantId: string, period: { start: string, end: string }, type: 'issued' | 'received') {
    const { service, profile } = await this.getSatService(tenantId);
    
    try {
      this.logger.log(`Solicitando descarga SAT para RFC: ${profile.rfc} Periodo: ${period.start} a ${period.end}`);
      
      const startDateTime = DateTime.create(period.start + ' 00:00:00');
      const endDateTime = DateTime.create(period.end + ' 23:59:59');
      const queryPeriod = DateTimePeriod.create(startDateTime, endDateTime);
      
      const downloadType = new (DownloadType as any)(type === 'issued' ? 'issued' : 'received');

      const queryParameters = (QueryParameters as any).create()
          .withPeriod(queryPeriod)
          .withDownloadType(downloadType)
          .withRequestType(new (RequestType as any)('xml'))
          .withDocumentStatus(new (DocumentStatus as any)('active'));

      const result = await service.query(queryParameters);

      if (!result.getStatus().isAccepted()) {
         throw new BadRequestException(`SAT rechazó la solicitud: ${result.getStatus().getMessage()}`);
      }

      const idSolicitud = result.getRequestId();
      if (!idSolicitud) {
          throw new BadRequestException("SAT no devolvió un Folio de Solicitud (Ticket ID) a pesar de haber aceptado la petición.");
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

    } catch (e) {
      this.logger.error("Error solicitando descarga masiva XML al SAT", e);
      // Clean up Prisma errors to show true cause
      let errorReason = e.message;
      if (e.message.includes("Invalid `this.prisma")) {
         const parts = e.message.split('\n');
         errorReason = "Prisma Error: " + parts[parts.length - 1]; // usually the reason is on the last line
      }
      throw new BadRequestException("Fallo en la comunicación con WebService del SAT:\n" + errorReason);
    }
  }

  /**
   * 2. Verificar estado de la Solicitud
   */
  async verifyDownload(tenantId: string, idSolicitud: string) {
      const { service } = await this.getSatService(tenantId);
      
      const verifyResult = await service.verify(idSolicitud);
      const resultStatus: any = verifyResult.getStatus();
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

  async getRequests(tenantId: string) {
      return this.prisma.satDownloadRequest.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' }
      });
  }

  /**
   * 3. Descargar Paquete y Enviar a Buzón (DRAFT)
   */
  async downloadAndProcessPackage(tenantId: string, idPaquete: string) {
    try {
      const { service, profile } = await this.getSatService(tenantId);
      this.logger.log(`Descargando paquete XML: ${idPaquete}`);
      
      // En una implementación real se desempaqueta y se procesan en lote
      const downloadResult = await service.download(idPaquete);
      const pkgContent = (downloadResult as any).getPackageContent ? (downloadResult as any).getPackageContent() : downloadResult;
      const st = (downloadResult as any).getStatus ? (downloadResult as any).getStatus() : null;
      
      if (st && !st.isAccepted()) {
          throw new BadRequestException(`El SAT bloqueó o rechazó la descarga: ${st.getMessage()} (Cód: ${st.getCode()})`);
      }

      if (!pkgContent || pkgContent.length === 0) {
          throw new BadRequestException(`El paquete SAT fue descargado pero está vacío. Estado del SAT: ${st ? st.getMessage() : 'Desconocido'}`);
      }

      this.logger.log(`Paquete SAT obtenido: ${(pkgContent.length / 1024).toFixed(2)} KB.`);

      // Extraer y procesar ZIP
      const zipInstance = await new JSZip().loadAsync(Buffer.from(pkgContent, 'base64'));

      let invoicesCreated = 0;
      let expensesCreated = 0;
      let duplicatesIgnored = 0;

      const filesList = Object.keys(zipInstance.files);
      this.logger.log(`Archivos encontrados en el ZIP: ${filesList.join(", ")}`);

      for (const [relativePath, zipEntryRaw] of Object.entries(zipInstance.files)) {
         const zipEntry: any = zipEntryRaw;
         if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.xml')) {
            const xmlBuffer = await zipEntry.async('nodebuffer');
            const xmlContent = xmlBuffer.toString('utf-8');
            
            try {
               const parsed = await parseStringPromise(xmlContent);
               const comprobante = parsed['cfdi:Comprobante'] || parsed['Comprobante'];
               if (!comprobante) continue;
               
               const timbre = comprobante['cfdi:Complemento']?.[0]?.['tfd:TimbreFiscalDigital']?.[0]?.['$'] || {};
               const uuid = timbre.UUID;
               if (!uuid) continue;

               // Verificar si existe para asegurar la Idempotencia
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
                  // Es un Gasto (El receptor somos nosotros)
                  
                  // Lógica para atar Proveedor si no existe
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

                  // === MÓDULO EFOS (ANTI-FRAUDE) ===
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
                        amount: total, // Simplificado, el real deberia deducirse del subtotal base
                        status: isEfos ? 'DRAFT-FRAUD' : 'DRAFT', // ¡Buzón de Revisión Antifraudes!
                        xmlContent,
                        description: isEfos ? `¡FRAUDE ART: 69-B! Factura Descargada de SAT Autómata (${uuid.split('-')[0]})` : `Factura Descargada de SAT Autómata (${uuid.split('-')[0]})`
                     }
                  });
                  expensesCreated++;
               } else {
                  // Es un Ingreso (Factura Emitida por Nosotros)
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

                  const taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId }});

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

            } catch(e) {
               this.logger.warn(`Error parseando XML ${relativePath}: ${e.message}`);
            }
         }
      }

      await this.prisma.satDownloadRequest.update({
          where: { idSolicitud: await this.findSolicitudIdByPackage(idPaquete) || "" },
          data: { status: 'SUCCESS' }
      }).catch(e => null); // Ignorar si no se halla

      return {
          processStats: {
             invoicesCreated,
             expensesCreated,
             duplicatesIgnored
          },
          packageSize: pkgContent.length,
          message: 'Buzón sincronizado en DRAFT.'
      }
    } catch (e) {
        this.logger.error("Error crítico descifrando paquete SAT", e);
        throw new BadRequestException("Fallo al descargar/procesar paquete: " + e.message);
    }
  }

  private async findSolicitudIdByPackage(packageId: string) {
      const p = await this.prisma.satDownloadRequest.findFirst({
         where: { packageIds: { contains: packageId } }
      });
      return p?.idSolicitud;
  }
}
