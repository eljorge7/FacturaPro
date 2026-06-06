import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Processes a top-up or service payment using a Mock Provider.
   * Later, this can be swapped with real HTTP calls to MTCenter or Taecel.
   */
  async processTopup(tenantId: string, type: string, carrier: string, amount: number, reference: string, invoiceId?: string) {
    
    // 1. Crear el registro en PENDING
    const transaction = await this.prisma.topupTransaction.create({
      data: {
        tenantId,
        type, // "RECARGA" o "SERVICIO"
        carrier,
        amount,
        reference,
        status: 'PENDING',
        invoiceId
      }
    });

    // 2. Simular llamada al Proveedor (Mock)
    const providerResult = await this.mockProviderCall(carrier, amount, reference);

    if (providerResult.success) {
      // 3. Éxito
      await this.prisma.topupTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          providerResponse: {
             folio: providerResult.folio,
             timestamp: providerResult.timestamp,
             message: providerResult.message
          }
        }
      });
      return { success: true, folio: providerResult.folio, transactionId: transaction.id };
    } else {
      // 4. Fallo
      await this.prisma.topupTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          providerResponse: {
             error: providerResult.error,
             message: providerResult.message
          }
        }
      });
      throw new BadRequestException(`Fallo en el proveedor: ${providerResult.message}`);
    }
  }

  private mockProviderCall(carrier: string, amount: number, reference: string): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulamos un fallo del 5% de las veces si el número empieza con "000"
        if (reference.startsWith('000')) {
           resolve({
             success: false,
             message: "Número inválido o fuera de servicio.",
             error: "ERR_INVALID_NUMBER"
           });
           return;
        }

        // Éxito
        resolve({
          success: true,
          folio: `AUTH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`,
          timestamp: new Date().toISOString(),
          message: "Aprobado"
        });
      }, 1500); // 1.5s delay simulates network call
    });
  }
}
