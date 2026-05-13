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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EfosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EfosService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const https = __importStar(require("https"));
const papaparse = __importStar(require("papaparse"));
let EfosService = EfosService_1 = class EfosService {
    prisma;
    logger = new common_1.Logger(EfosService_1.name);
    SAT_EFOS_URL = 'https://omawww.sat.gob.mx/cifras_sat/Documents/Listado_Completo_69-B.csv';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async syncEfosList() {
        this.logger.log("Iniciando sincronización de Lista EFOS (Art 69-B)...");
        return new Promise((resolve, reject) => {
            https.get(this.SAT_EFOS_URL, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error('SAT Endpoint returned ' + response.statusCode));
                }
                let data = '';
                response.setEncoding('latin1');
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', async () => {
                    this.logger.log(`CSV Descargado. Tamaño: ${(data.length / 1024 / 1024).toFixed(2)} MB. Procesando...`);
                    const lines = data.split('\n');
                    let startIndex = 0;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('RFC') && lines[i].includes('Nombre del Contribuyente')) {
                            startIndex = i;
                            break;
                        }
                    }
                    const cleanCsv = lines.slice(startIndex).join('\n');
                    papaparse.parse(cleanCsv, {
                        header: true,
                        skipEmptyLines: true,
                        complete: async (results) => {
                            const records = results.data;
                            const validRecords = [];
                            const rfcKey = Object.keys(records[0] || {}).find(k => k.trim().toUpperCase() === 'RFC');
                            const nameKey = Object.keys(records[0] || {}).find(k => k.trim().toUpperCase().includes('NOMBRE'));
                            const sitKey = Object.keys(records[0] || {}).find(k => k.trim().toUpperCase().includes('SITUAC'));
                            if (!rfcKey)
                                return reject(new Error("Formato del CSV del SAT ha cambiado (RFC no hallado)"));
                            const seenRfcs = new Set();
                            for (const record of records) {
                                const row = record;
                                let rfc = String(rfcKey ? row[rfcKey] : "").trim();
                                let nombre = String(nameKey ? row[nameKey] : (row['Nombre del Contribuyente'] || "")).trim();
                                let situacion = String(sitKey ? row[sitKey] : (row['Situación del contribuyente'] || "")).trim();
                                if (!rfc || rfc.length < 12 || seenRfcs.has(rfc))
                                    continue;
                                validRecords.push({
                                    id: require('crypto').randomUUID(),
                                    rfc: rfc.toUpperCase(),
                                    nombre,
                                    situacion,
                                    fechaPublicacion: new Date()
                                });
                                seenRfcs.add(rfc);
                            }
                            this.logger.log(`Parsed ${validRecords.length} EFOS detectados del SAT. Limpiando DB actual...`);
                            await this.prisma.efosRecord.deleteMany();
                            this.logger.log(`Insertando ${validRecords.length} registros...`);
                            await this.prisma.efosRecord.createMany({
                                data: validRecords,
                                skipDuplicates: true
                            });
                            this.logger.log(`Sincronización EFOS completa y blindada.`);
                            resolve({ success: true, count: validRecords.length });
                        },
                        error: (error) => {
                            this.logger.error("Error parseando CSV", error);
                            reject(error);
                        }
                    });
                });
            }).on('error', (err) => {
                this.logger.error("Error descargando EFOS", err);
                reject(err);
            });
        });
    }
    async verifyRfc(rfc) {
        if (!rfc)
            return false;
        const efo = await this.prisma.efosRecord.findUnique({
            where: { rfc: rfc.toUpperCase() }
        });
        return !!efo;
    }
};
exports.EfosService = EfosService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EfosService.prototype, "syncEfosList", null);
exports.EfosService = EfosService = EfosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EfosService);
//# sourceMappingURL=efos.service.js.map