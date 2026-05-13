"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let XmlGeneratorService = class XmlGeneratorService {
    async generate(invoice, taxProfile) {
        try {
            const cerNumber = taxProfile.cerNumber || '30001000000500003435';
            let privateKey;
            let cerBase64;
            let emisorRfc = taxProfile.rfc || 'SPR190613I52';
            let emisorNombre = taxProfile.legalName || 'EMPRESA DEMO';
            let emisorRegimen = taxProfile.taxRegime || '601';
            const cleanBase64 = (str) => str ? str.replace(/^data:[^;]+;base64,/, "") : "";
            const fs = require('fs');
            const path = require('path');
            let cerPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.cer');
            if (!fs.existsSync(cerPath))
                cerPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.cer.cer');
            let keyPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.key');
            if (!fs.existsSync(keyPath))
                keyPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.key.key');
            if (fs.existsSync(cerPath) && fs.existsSync(keyPath)) {
                privateKey = crypto.createPrivateKey({
                    key: fs.readFileSync(keyPath),
                    format: 'der',
                    type: 'pkcs8',
                    passphrase: taxProfile.keyPassword || '12345678a'
                });
                cerBase64 = fs.readFileSync(cerPath).toString('base64');
                emisorRfc = 'IXS7607092R5';
                emisorNombre = 'INTERNACIONAL XIMBO Y SABORES';
                emisorRegimen = '601';
            }
            else if (taxProfile.keyBase64 && taxProfile.cerBase64 && taxProfile.keyPassword) {
                privateKey = crypto.createPrivateKey({
                    key: Buffer.from(cleanBase64(taxProfile.keyBase64), 'base64'),
                    format: 'der',
                    type: 'pkcs8',
                    passphrase: taxProfile.keyPassword
                });
                cerBase64 = cleanBase64(taxProfile.cerBase64);
            }
            else {
                const keys = crypto.generateKeyPairSync('rsa', {
                    modulusLength: 2048,
                    publicKeyEncoding: { type: 'spki', format: 'der' },
                    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
                });
                privateKey = crypto.createPrivateKey({ key: keys.privateKey, format: 'der', type: 'pkcs8' });
                cerBase64 = keys.publicKey.toString('base64');
            }
            const escapeXml = (unsafe) => {
                if (!unsafe)
                    return '';
                return unsafe
                    .toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');
            };
            const fechaLocal = invoice.date.toLocaleString('sv-SE').replace(' ', 'T');
            const cadenaParts = [];
            cadenaParts.push('4.0');
            cadenaParts.push('FAC');
            cadenaParts.push(invoice.invoiceNumber);
            cadenaParts.push(fechaLocal);
            cadenaParts.push(invoice.paymentForm || '01');
            cadenaParts.push(cerNumber);
            const currency = invoice.currency || 'MXN';
            const exchangeRate = invoice.exchangeRate || 1.0;
            cadenaParts.push(invoice.subtotal.toFixed(2));
            cadenaParts.push(currency);
            if (currency !== 'MXN' && currency !== 'XXX') {
                cadenaParts.push(exchangeRate.toFixed(4));
            }
            cadenaParts.push(invoice.total.toFixed(2));
            cadenaParts.push('I');
            cadenaParts.push('01');
            cadenaParts.push(invoice.paymentMethod || 'PUE');
            cadenaParts.push(taxProfile.zipCode);
            let emisorNombreSt = escapeXml(emisorNombre.toUpperCase().replace(/ S\.?A\.? DE C\.?V\.?$/i, '').trim());
            let receptorName = escapeXml(invoice.customer.legalName.toUpperCase().replace(/ S\.?A\.? DE C\.?V\.?$/i, '').trim());
            if (invoice.customer.rfc === 'XAXX010101000') {
                receptorName = 'PUBLICO EN GENERAL';
            }
            cadenaParts.push(emisorRfc);
            cadenaParts.push(emisorNombreSt);
            cadenaParts.push(emisorRegimen);
            cadenaParts.push(invoice.customer.rfc);
            cadenaParts.push(receptorName);
            cadenaParts.push(invoice.customer.zipCode || '00000');
            cadenaParts.push(invoice.customer.taxRegime || '601');
            cadenaParts.push(invoice.cfdiUse || 'G03');
            invoice.items.forEach((item) => {
                const importe = (item.unitPrice * item.quantity).toFixed(2);
                cadenaParts.push(item.product?.satProductCode || '01010101');
                cadenaParts.push(item.quantity.toString());
                cadenaParts.push(item.product?.satUnitCode || 'ACT');
                cadenaParts.push('Servicio');
                cadenaParts.push(escapeXml(item.description));
                cadenaParts.push(item.unitPrice.toFixed(2));
                cadenaParts.push(importe);
                cadenaParts.push('02');
                const tasaImporte = (item.unitPrice * item.quantity * item.taxRate).toFixed(2);
                cadenaParts.push(importe);
                cadenaParts.push('002');
                cadenaParts.push('Tasa');
                cadenaParts.push(item.taxRate.toFixed(6));
                cadenaParts.push(tasaImporte);
            });
            cadenaParts.push(invoice.subtotal.toFixed(2));
            cadenaParts.push('002');
            cadenaParts.push('Tasa');
            cadenaParts.push('0.160000');
            cadenaParts.push(invoice.taxTotal.toFixed(2));
            cadenaParts.push(invoice.taxTotal.toFixed(2));
            const cadenaOriginal = `||${cadenaParts.join('|')}||`;
            const sign = crypto.createSign('SHA256');
            sign.update(cadenaOriginal);
            const sello = sign.sign(privateKey, 'base64');
            const tipoCambioAttr = (currency !== 'MXN' && currency !== 'XXX') ? ` TipoCambio="${exchangeRate.toFixed(4)}"` : '';
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="4.0" Serie="FAC" Folio="${invoice.invoiceNumber}" Fecha="${fechaLocal}" Sello="${sello}" FormaPago="${invoice.paymentForm || '01'}" NoCertificado="${cerNumber}" Certificado="${cerBase64}" SubTotal="${invoice.subtotal.toFixed(2)}" Moneda="${currency}"${tipoCambioAttr} Total="${invoice.total.toFixed(2)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${invoice.paymentMethod || 'PUE'}" LugarExpedicion="${taxProfile.zipCode}">
  <cfdi:Emisor Rfc="${emisorRfc}" Nombre="${emisorNombreSt}" RegimenFiscal="${emisorRegimen}"/>
  <cfdi:Receptor Rfc="${invoice.customer.rfc}" Nombre="${receptorName}" UsoCFDI="${invoice.cfdiUse || 'G03'}" RegimenFiscalReceptor="${invoice.customer.taxRegime || '601'}" DomicilioFiscalReceptor="${invoice.customer.zipCode || '00000'}"/>
  <cfdi:Conceptos>
    ${invoice.items.map((item) => `
    <cfdi:Concepto ClaveProdServ="${item.product?.satProductCode || '01010101'}" ClaveUnidad="${item.product?.satUnitCode || 'ACT'}" Cantidad="${item.quantity}" Unidad="Servicio" Descripcion="${escapeXml(item.description)}" ValorUnitario="${item.unitPrice.toFixed(2)}" Importe="${(item.unitPrice * item.quantity).toFixed(2)}" ObjetoImp="02">
       <cfdi:Impuestos>
         <cfdi:Traslados>
           <cfdi:Traslado Base="${(item.unitPrice * item.quantity).toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${item.taxRate.toFixed(6)}" Importe="${(item.unitPrice * item.quantity * item.taxRate).toFixed(2)}"/>
         </cfdi:Traslados>
       </cfdi:Impuestos>
    </cfdi:Concepto>
    `).join('')}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${invoice.taxTotal.toFixed(2)}">
     <cfdi:Traslados>
        <cfdi:Traslado Base="${invoice.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${invoice.taxTotal.toFixed(2)}"/>
     </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;
            return { xml, sello, cadenaOriginal };
        }
        catch (error) {
            throw new common_1.BadRequestException("Fallo al generar el Sellado Digital. Verifica que la contraseña del archivo .key sea correcta: " + error.message);
        }
    }
};
exports.XmlGeneratorService = XmlGeneratorService;
exports.XmlGeneratorService = XmlGeneratorService = __decorate([
    (0, common_1.Injectable)()
], XmlGeneratorService);
//# sourceMappingURL=xml-generator.service.js.map