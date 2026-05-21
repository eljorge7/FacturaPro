import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    // Si no hay key, ponemos una dummy para que no falle al compilar, pero fallará al enviar.
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');
  }

  async sendQuoteEmail(to: string, quoteNumber: string, proposalUrl: string, customerName: string) {
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
        from: 'FacturaPro <onboarding@resend.dev>', // Si tienes un dominio verificado en Resend ponlo aquí (ej: notificaciones@tudominio.com)
        to: [to],
        subject: `Propuesta Comercial #${quoteNumber} 🚀`,
        html: htmlTemplate,
      });

      if (data.error) {
         throw new Error(data.error.message);
      }

      this.logger.log(`Email enviado con Resend: ${data.data?.id}`);
      return { success: true, messageId: data.data?.id };
    } catch (error: any) {
      this.logger.error('Error al enviar correo con Resend:', error.message);
      throw error;
    }
  }
}
