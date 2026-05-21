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
var CryptoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let CryptoService = CryptoService_1 = class CryptoService {
    logger = new common_1.Logger(CryptoService_1.name);
    algorithm = 'aes-256-gcm';
    prefix = 'enc:v1:';
    get secretKey() {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            return '';
        }
        if (key.length !== 32) {
            return crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
        }
        return key;
    }
    encrypt(text) {
        if (!text)
            return text;
        if (text.startsWith(this.prefix))
            return text;
        const key = this.secretKey;
        if (!key) {
            this.logger.warn('ENCRYPTION_KEY no encontrada en variables de entorno. Almacenando dato confidencial en TEXTO PLANO.');
            return text;
        }
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key, 'utf8'), iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag().toString('hex');
            return `${this.prefix}${iv.toString('hex')}:${authTag}:${encrypted}`;
        }
        catch (error) {
            this.logger.error('Error al cifrar el texto', error);
            return text;
        }
    }
    decrypt(text) {
        if (!text)
            return text;
        if (!text.startsWith(this.prefix))
            return text;
        const key = this.secretKey;
        if (!key) {
            this.logger.error('Intentando descifrar dato, pero ENCRYPTION_KEY no está configurada.');
            return text;
        }
        try {
            const parts = text.split(':');
            const iv = Buffer.from(parts[2], 'hex');
            const authTag = Buffer.from(parts[3], 'hex');
            const encryptedText = parts[4];
            const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(key, 'utf8'), iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Error al descifrar el texto (¿Llave incorrecta?)', error);
            return text;
        }
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = CryptoService_1 = __decorate([
    (0, common_1.Injectable)()
], CryptoService);
//# sourceMappingURL=crypto.service.js.map