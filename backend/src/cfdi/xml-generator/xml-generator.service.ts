import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class XmlGeneratorService {
  /**
   * Transmuta la Invoice Prisma en un CFDI 4.0 XML y calcula su Sello Digital Localmente.
   * Garantiza la independencia de PACs al no delegarles el ensamblado del XML.
   */
  async generate(invoice: any, taxProfile: any) {
    try {
        const cerNumber = taxProfile.cerNumber || '30001000000500003435'; // Test CSD number actualizado para SWSapiens

        let privateKey;
        let cerBase64;
        let emisorRfc = taxProfile.rfc || 'SPR190613I52';
        let emisorNombre = taxProfile.legalName || 'EMPRESA DEMO';
        let emisorRegimen = taxProfile.taxRegime || '601';

        const cleanBase64 = (str: string) => str ? str.replace(/^data:[^;]+;base64,/, "") : "";
        const fs = require('fs');
        const path = require('path');
        
        // __dirname apunta a 'dist', debemos buscar en la raíz o en src directamente
        let cerPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.cer');
        if (!fs.existsSync(cerPath)) cerPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.cer.cer');
        
        let keyPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.key');
        if (!fs.existsSync(keyPath)) keyPath = path.join(process.cwd(), 'src', 'cfdi', 'xml-generator', 'pruebas.key.key');

        if (fs.existsSync(cerPath) && fs.existsSync(keyPath)) {
            // Hardcode del bypass físico de certificados!
            privateKey = crypto.createPrivateKey({
               key: fs.readFileSync(keyPath),
               format: 'der',
               type: 'pkcs8',
               passphrase: taxProfile.keyPassword || '12345678a' // Contraseña default del SAT para pruebas
            });
            cerBase64 = fs.readFileSync(cerPath).toString('base64');
            
            // Si es el certificado físico de prueba, obligamos sus datos exactos para el PAC
            emisorRfc = 'IXS7607092R5';
            emisorNombre = 'INTERNACIONAL XIMBO Y SABORES'; // CFDI 4.0 sin SA DE CV
            emisorRegimen = '601';

            // ATENCIÓN: Se eliminó la sobreescritura obligatoria del Cliente (Receptor).
            // Ahora la factura usará los datos fiscales reales ingresados en la interfaz
            // permitiendo probar al cliente Yori y las advertencias de Banxico y Moneda Extranjera.
        }
        else if (taxProfile.keyBase64 && taxProfile.cerBase64 && taxProfile.keyPassword) {
            privateKey = crypto.createPrivateKey({
               key: Buffer.from(cleanBase64(taxProfile.keyBase64), 'base64'),
               format: 'der',
               type: 'pkcs8',
               passphrase: taxProfile.keyPassword
            });
            cerBase64 = cleanBase64(taxProfile.cerBase64);
        } else {
            // -- OPCION 2 (Bypass MVP) -- Genera un par RSA falso para que Node pueda sellar matemáticamente 
            // y SW Sapiens alcance a validar la estructura XML (aunque rechace el certificado de prueba al final por no estar en LCO)
            const keys = crypto.generateKeyPairSync('rsa', {
               modulusLength: 2048,
               publicKeyEncoding: { type: 'spki', format: 'der' },
               privateKeyEncoding: { type: 'pkcs8', format: 'der' }
            });
            privateKey = crypto.createPrivateKey({ key: keys.privateKey, format: 'der', type: 'pkcs8' });
            cerBase64 = keys.publicKey.toString('base64');
        }

        const escapeXml = (unsafe: string) => {
            if (!unsafe) return '';
            return unsafe
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        // 1. Armar Cadena Original Real según la secuencia estricta del XSLT CFDI 4.0
        // SWSapiens exige timezone de expedición. Usamos locale 'sv-SE' que da un string "YYYY-MM-DD HH:mm:ss" directo.
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
        cadenaParts.push('01'); // Exportacion
        cadenaParts.push(invoice.paymentMethod || 'PUE');
        cadenaParts.push(taxProfile.zipCode);
        
        // Strict CFDI 4.0 Rules: Uppercase and remove S.A. de C.V.
        let emisorNombreSt = escapeXml(emisorNombre.toUpperCase().replace(/ S\.?A\.? DE C\.?V\.?$/i, '').trim());
        let receptorName = escapeXml(invoice.customer.legalName.toUpperCase().replace(/ S\.?A\.? DE C\.?V\.?$/i, '').trim());
        if (invoice.customer.rfc === 'XAXX010101000') {
           receptorName = 'PUBLICO EN GENERAL';
        }

        // Emisor
        cadenaParts.push(emisorRfc);
        cadenaParts.push(emisorNombreSt);
        cadenaParts.push(emisorRegimen);
        
        // Receptor
        cadenaParts.push(invoice.customer.rfc);
        cadenaParts.push(receptorName);
        cadenaParts.push(invoice.customer.zipCode || '00000');
        cadenaParts.push(invoice.customer.taxRegime || '601');
        cadenaParts.push(invoice.cfdiUse || 'G03');

        // Conceptos
        invoice.items.forEach((item: any) => {
            const importe = (item.unitPrice * item.quantity).toFixed(2);
            cadenaParts.push(item.product?.satProductCode || '01010101');
            cadenaParts.push(item.quantity.toString());
            cadenaParts.push(item.product?.satUnitCode || 'ACT');
            cadenaParts.push('Servicio');
            cadenaParts.push(escapeXml(item.description));
            cadenaParts.push(item.unitPrice.toFixed(2));
            cadenaParts.push(importe); // Importe sin impuestos
            cadenaParts.push('02'); // ObjetoImp

            // Concepto Traslados
            const tasaImporte = (item.unitPrice * item.quantity * item.taxRate).toFixed(2);
            cadenaParts.push(importe); // Base
            cadenaParts.push('002');
            cadenaParts.push('Tasa');
            cadenaParts.push(item.taxRate.toFixed(6));
            cadenaParts.push(tasaImporte);
        });

        // Impuestos Globales Traslados
        cadenaParts.push(invoice.subtotal.toFixed(2)); // Base del traslado global
        cadenaParts.push('002');
        cadenaParts.push('Tasa');
        cadenaParts.push('0.160000');
        cadenaParts.push(invoice.taxTotal.toFixed(2));
        cadenaParts.push(invoice.taxTotal.toFixed(2)); // TotalImpuestosTrasladados

        const cadenaOriginal = `||${cadenaParts.join('|')}||`;

        const sign = crypto.createSign('SHA256');
        sign.update(cadenaOriginal);
        const sello = sign.sign(privateKey, 'base64');

        const tipoCambioAttr = (currency !== 'MXN' && currency !== 'XXX') ? ` TipoCambio="${exchangeRate.toFixed(4)}"` : '';

        // 3. Renderizar XML Puro (CFDI 4.0 Compliant Shape) sin romper dependencias
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="4.0" Serie="FAC" Folio="${invoice.invoiceNumber}" Fecha="${fechaLocal}" Sello="${sello}" FormaPago="${invoice.paymentForm || '01'}" NoCertificado="${cerNumber}" Certificado="${cerBase64}" SubTotal="${invoice.subtotal.toFixed(2)}" Moneda="${currency}"${tipoCambioAttr} Total="${invoice.total.toFixed(2)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${invoice.paymentMethod || 'PUE'}" LugarExpedicion="${taxProfile.zipCode}">
  <cfdi:Emisor Rfc="${emisorRfc}" Nombre="${emisorNombreSt}" RegimenFiscal="${emisorRegimen}"/>
  <cfdi:Receptor Rfc="${invoice.customer.rfc}" Nombre="${receptorName}" UsoCFDI="${invoice.cfdiUse || 'G03'}" RegimenFiscalReceptor="${invoice.customer.taxRegime || '601'}" DomicilioFiscalReceptor="${invoice.customer.zipCode || '00000'}"/>
  <cfdi:Conceptos>
    ${invoice.items.map((item: any) => `
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

    } catch (error) {
        throw new BadRequestException("Fallo al generar el Sellado Digital. Verifica que la contraseña del archivo .key sea correcta: " + error.message);
    }
  }
}
