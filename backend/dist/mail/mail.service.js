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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
let MailService = MailService_1 = class MailService {
    resend;
    logger = new common_1.Logger(MailService_1.name);
    constructor() {
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');
    }
    async sendQuoteEmail(to, quoteNumber, proposalUrl, customerName) {
        const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
         <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Propuesta Comercial Lista</h1>
         </div>
         <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #1e293b; margin-top: 0;">¡Hola, ${customerName}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
               Hemos preparado una propuesta comercial detallada para tu proyecto. Puedes revisarla interactivamente en línea accediendo al siguiente enlace:
            </p>
            <div style="text-align: center; margin: 30px 0;">
               <a href="${proposalUrl}" style="background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 4px; display: inline-block;">Ver Propuesta #${quoteNumber}</a>
            </div>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; border-left: 4px solid #10b981; padding-left: 10px; background-color: #f8fafc;">
               Status de Envío: <strong style="color: #10b981;">100% Blindado (Anti-Spam M2M)</strong>
            </p>
         </div>
         <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
               Generado automáticamente por el Ecosistema B2B de RentControl y FacturaPro.
            </p>
         </div>
      </div>
    `;
        try {
            const data = await this.resend.emails.send({
                from: 'FacturaPro <onboarding@resend.dev>',
                to: [to],
                subject: `Propuesta Comercial #${quoteNumber} 🚀`,
                html: htmlTemplate,
            });
            if (data.error) {
                throw new Error(data.error.message);
            }
            this.logger.log(`Email enviado con Resend: ${data.data?.id}`);
            return { success: true, messageId: data.data?.id };
        }
        catch (error) {
            this.logger.error('Error al enviar correo con Resend:', error.message);
            throw error;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map