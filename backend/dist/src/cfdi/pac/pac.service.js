"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacService = void 0;
const common_1 = require("@nestjs/common");
let PacService = class PacService {
    async stampXml(xmlBase64, env = 'SANDBOX') {
        const apiUrl = env === 'SANDBOX'
            ? 'https://services.test.sw.com.mx/v4/cfdi33/stamp/v4'
            : 'https://services.sw.com.mx/v4/cfdi33/stamp/v4';
        const token = process.env.SW_SAPIENS_TOKEN || 'DEMO_TOKEN';
        if (token === 'DEMO_TOKEN') {
            throw new common_1.BadRequestException('Falta configurar SW_SAPIENS_TOKEN en el archivo .env del backend.');
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
            let data = {};
            try {
                if (rawText)
                    data = JSON.parse(rawText);
            }
            catch (parseError) {
                throw new common_1.BadRequestException(`Error de protocolo del PAC (HTTP ${response.status}). Respuesta: ` + rawText.substring(0, 100));
            }
            if (!response.ok || data.status === 'error') {
                const errorMsg = data.messageDetail || data.message || `Error desconocido del PAC (Status: ${response.status})`;
                throw new common_1.BadRequestException(`El PAC rechazó el Timbrado: ${errorMsg}`);
            }
            return {
                satUuid: data.data.uuid,
                selloSAT: data.data.selloSAT,
                stampedXml: data.data.cfdi,
                fechaTimbrado: data.data.fechaTimbrado || new Date().toISOString()
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Error de conexión al PAC: ${error.message}`);
        }
    }
    async cancelCfdi(options, env = 'SANDBOX') {
        const apiUrl = env === 'SANDBOX'
            ? 'https://services.test.sw.com.mx/cfdi33/cancel/csd'
            : 'https://services.sw.com.mx/cfdi33/cancel/csd';
        const token = process.env.SW_SAPIENS_TOKEN || 'DEMO_TOKEN';
        if (token === 'DEMO_TOKEN')
            throw new common_1.BadRequestException('Falta token del PAC');
        const payload = {
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
            let data = {};
            try {
                data = JSON.parse(rawText);
            }
            catch { }
            if (!response.ok || data.status === 'error') {
                const errorMsg = data.messageDetail || data.message || `Error del PAC (${response.status})`;
                throw new common_1.BadRequestException(`El SAT/PAC rechazó la cancelación: ${errorMsg}`);
            }
            return {
                acuse: data.data?.acuse || 'CANCELACION_ACEPTADA',
                status: 'success'
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException(`Fallo crítico al conectar con el PAC para cancelar: ${error.message}`);
        }
    }
};
exports.PacService = PacService;
exports.PacService = PacService = __decorate([
    (0, common_1.Injectable)()
], PacService);
//# sourceMappingURL=pac.service.js.map