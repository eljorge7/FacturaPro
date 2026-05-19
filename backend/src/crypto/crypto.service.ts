import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly prefix = 'enc:v1:';

  // Usa la llave del entorno. Si no existe en .env, usa un default SOLO PARA DESARROLLO (Peligro en Prod).
  // La llave debe tener exactamente 32 caracteres (256 bits).
  private get secretKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      return '';
    }
    // Si la llave no tiene 32 bytes, intentamos crear un hash de 32 bytes de ella
    if (key.length !== 32) {
      return crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
    }
    return key;
  }

  encrypt(text: string | null | undefined): string | null {
    if (!text) return text as any;
    if (text.startsWith(this.prefix)) return text; // Ya está cifrado
    
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
    } catch (error) {
      this.logger.error('Error al cifrar el texto', error);
      return text; // Failsafe
    }
  }

  decrypt(text: string | null | undefined): string | null {
    if (!text) return text as any;
    if (!text.startsWith(this.prefix)) return text; // Es texto plano antiguo (Legacy)
    
    const key = this.secretKey;
    if (!key) {
      this.logger.error('Intentando descifrar dato, pero ENCRYPTION_KEY no está configurada.');
      return text; // Devolvemos el string cifrado porque no podemos abrirlo
    }

    try {
      const parts = text.split(':');
      // parts[0] = 'enc'
      // parts[1] = 'v1'
      const iv = Buffer.from(parts[2], 'hex');
      const authTag = Buffer.from(parts[3], 'hex');
      const encryptedText = parts[4];

      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(key, 'utf8'), iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Error al descifrar el texto (¿Llave incorrecta?)', error);
      return text; // Devolvemos corrupto en lugar de crashear duro
    }
  }
}
