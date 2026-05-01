import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTaxProfileDto } from './dto/create-tax-profile.dto';
import { UpdateTaxProfileDto } from './dto/update-tax-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(createTaxProfileDto: CreateTaxProfileDto) {
    return this.prisma.taxProfile.create({
      data: createTaxProfileDto,
    });
  }

  async findAll() {
    return this.prisma.taxProfile.findMany();
  }

  async findOne(id: string) {
    const profile = await this.prisma.taxProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new NotFoundException('Tax Profile not found');
    return profile;
  }

  async findMine(tenantId: string) {
    let profile = await this.prisma.taxProfile.findFirst({
       where: { tenantId }
    });
    if (!profile) {
       // Si no hay perfil, tomamos el tenant y lo creamos
       const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
       if(tenant) {
           profile = await this.prisma.taxProfile.create({
              data: {
                 tenantId: tenant.id,
                 rfc: 'XAXX010101000',
                 legalName: tenant.name || 'Empresa Demo S.A de C.V',
                 billingPhone: tenant.phone || '',
                 taxRegime: '601',
                 zipCode: '00000',
                 pdfTemplate: 'Estándar - Estilo europeo'
              }
           });
       } else {
           throw new NotFoundException('El sistema no está inicializado con un Tenant válido.');
       }
    }
    return profile;
  }

  async update(id: string, updateTaxProfileDto: any) {
    const profile = await this.findOne(id);
    
    let { logoBase64, removeLogo, ...dataToUpdate } = updateTaxProfileDto;
    const fs = require('fs');
    const path = require('path');
    let logoUrl = undefined;

    // Validación criptográfica de CSD
    const cerStr = dataToUpdate.cerBase64 !== undefined ? dataToUpdate.cerBase64 : profile.cerBase64;
    const keyStr = dataToUpdate.keyBase64 !== undefined ? dataToUpdate.keyBase64 : profile.keyBase64;
    const pass = dataToUpdate.keyPassword !== undefined ? dataToUpdate.keyPassword : profile.keyPassword;

    if (cerStr && keyStr && pass && (dataToUpdate.cerBase64 !== undefined || dataToUpdate.keyBase64 !== undefined || dataToUpdate.keyPassword !== undefined)) {
        try {
            const crypto = require('crypto');
            const cleanKey = keyStr.toString().replace(/^data:application\/\w+;base64,/, "");
            // Si la contraseña es inválida o el archivo .key no es válido, esto arrojará error
            const privateKey = crypto.createPrivateKey({
                key: Buffer.from(cleanKey, 'base64'),
                format: 'der',
                type: 'pkcs8',
                passphrase: pass,
            });
        } catch (err) {
            throw new BadRequestException('El archivo .key o la contraseña proporcionada son inválidos. Los Certificados de Sello Digital (CSD) deben coincidir y estar vigentes.');
        }
    }

    if (removeLogo) {
       (dataToUpdate as any).logoUrl = null;
    } else if (logoBase64) {
       try {
           const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
           if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
           }
           // Remove prefix e.g. "data:image/png;base64,"
           const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
           const fileName = `logo-${id}-${Date.now()}.png`;
           const filePath = path.join(uploadsDir, fileName);
           fs.writeFileSync(filePath, base64Data, 'base64');
           logoUrl = `/uploads/${fileName}`;
       } catch (err) {
           console.error("Error saving logo:", err);
       }
    }

    if (logoUrl) {
       (dataToUpdate as any).logoUrl = logoUrl;
    }

    return this.prisma.taxProfile.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.taxProfile.delete({
      where: { id },
    });
  }

  // === SERIES Y FOLIOS ===
  async getSeries(tenantId: string) {
     return this.prisma.invoiceSeries.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createSeries(tenantId: string, data: any) {
     let taxProfile = await this.findMine(tenantId);
     
     if (data.isDefault) {
         await this.prisma.invoiceSeries.updateMany({
             where: { tenantId, type: data.type || "INVOICE" },
             data: { isDefault: false }
         });
     }

     return this.prisma.invoiceSeries.create({
         data: {
             tenantId,
             taxProfileId: taxProfile.id,
             name: data.name,
             prefix: data.prefix,
             nextFolio: parseInt(data.nextFolio) || 1,
             isDefault: data.isDefault || false,
             type: data.type || "INVOICE"
         }
     });
  }

  async updateSeries(tenantId: string, id: string, data: any) {
      if (data.isDefault) {
          const s = await this.prisma.invoiceSeries.findUnique({ where: { id }});
          if(s) {
              await this.prisma.invoiceSeries.updateMany({
                  where: { tenantId, type: s.type },
                  data: { isDefault: false }
              });
          }
      }
      
      const updateData: any = { ...data };
      if (updateData.nextFolio) updateData.nextFolio = parseInt(updateData.nextFolio);

      return this.prisma.invoiceSeries.update({
          where: { id },
          data: updateData
      });
  }

  async deleteSeries(id: string) {
      return this.prisma.invoiceSeries.delete({ where: { id }});
  }
}
