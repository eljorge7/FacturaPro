import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PacService {
  /**
   * Adaptador M2M: Envía el XML Sellado a SW Sapiens o Finkok (PAC) para obtener el Timbre Fiscal Digital (UUID).
   * 
   * @param xmlBase64 El XML firmado en formato Base64.
   * @param env Entorno actual (SANDBOX | PRODUCTION).
   */
  async stampXml(xmlBase64: string, env: 'SANDBOX' | 'PRODUCTION' = 'SANDBOX') {
    // Para CFDI 4.0, SW Sapiens usa la URL de v4
    const apiUrl = env === 'SANDBOX' 
      ? 'https://services.test.sw.com.mx/v4/cfdi33/stamp/v4'
      : 'https://services.sw.com.mx/v4/cfdi33/stamp/v4';

    const token = process.env.SW_SAPIENS_TOKEN || 'DEMO_TOKEN';

    if (token === 'DEMO_TOKEN') {
      throw new BadRequestException('Falta configurar SW_SAPIENS_TOKEN en el archivo .env del backend.');
    }

    try {
      const rawXml = Buffer.from(xmlBase64, 'base64').toString('utf8');
      const formData = new FormData();
      formData.append('xml', new Blob([rawXml], { type: 'text/xml' }), 'factura.xml');

      const response = await fetch(apiUrl, {
         method: 'POST',
         headers: {
             'Authorization': `bearer ${token}`
         },
         body: formData
      });
      
      const rawText = await response.text();
      let data: any = {};
      
      try {
         if (rawText) data = JSON.parse(rawText);
      } catch (parseError) {
         throw new BadRequestException(`Error de protocolo del PAC (HTTP ${response.status}). Respuesta: ` + rawText.substring(0, 100));
      }

      if (!response.ok || data.status === 'error') {
         // SW Sapiens suele regresar detalles en data.message o data.messageDetail
         const errorMsg = data.messageDetail || data.message || `Error desconocido del PAC (Status: ${response.status})`;
         throw new BadRequestException(`El PAC rechazó el Timbrado: ${errorMsg}`);
      }
      
      return { 
        satUuid: data.data.uuid, 
        selloSAT: data.data.selloSAT, 
        stampedXml: data.data.cfdi,
        fechaTimbrado: data.data.fechaTimbrado || new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error de conexión al PAC: ${error.message}`);
    }
  }

  /**
   * Petición de Cancelación al PAC usando CSD
   */
  async cancelCfdi(
    options: {
      uuid: string;
      passwordCsd: string;
      rfc: string;
      b64Cer: string;
      b64Key: string;
      motivo: string;
      folioSustitucion?: string;
    },
    env: 'SANDBOX' | 'PRODUCTION' = 'SANDBOX'
  ) {
    const apiUrl = env === 'SANDBOX' 
      ? 'https://services.test.sw.com.mx/cfdi33/cancel/csd'
      : 'https://services.sw.com.mx/cfdi33/cancel/csd';

    const token = process.env.SW_SAPIENS_TOKEN || 'DEMO_TOKEN';
    if (token === 'DEMO_TOKEN') throw new BadRequestException('Falta token del PAC');

    const payload: any = {
      uuid: options.uuid,
      password: options.passwordCsd,
      rfc: options.rfc,
      b64Cer: options.b64Cer,
      b64Key: options.b64Key,
      motivo: options.motivo
    };

    if (options.motivo === '01' && options.folioSustitucion) {
       payload.folioSustitucion = options.folioSustitucion;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch {}

      if (!response.ok || data.status === 'error') {
         const errorMsg = data.messageDetail || data.message || `Error del PAC (${response.status})`;
         throw new BadRequestException(`El SAT/PAC rechazó la cancelación: ${errorMsg}`);
      }

      return {
         acuse: data.data?.acuse || 'CANCELACION_ACEPTADA',
         status: 'success'
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Fallo crítico al conectar con el PAC para cancelar: ${error.message}`);
    }
  }
}
