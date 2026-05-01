import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as https from 'https';
import * as papaparse from 'papaparse';

@Injectable()
export class EfosService {
  private readonly logger = new Logger(EfosService.name);
  private readonly SAT_EFOS_URL = 'https://omawww.sat.gob.mx/cifras_sat/Documents/Listado_Completo_69-B.csv';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sincroniza la Lista Negra del Art. 69-B desde el portal oficial del SAT.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncEfosList() {
    this.logger.log("Iniciando sincronización de Lista EFOS (Art 69-B)...");
    
    return new Promise((resolve, reject) => {
       https.get(this.SAT_EFOS_URL, (response) => {
          if (response.statusCode !== 200) {
             return reject(new Error('SAT Endpoint returned ' + response.statusCode));
          }

          let data = '';
          // SAT data is mostly ISO-8859-1 or Windows-1252 but JS translates the buffer loosely.
          // RFCs are plain ASCII, so it works.
          response.setEncoding('latin1');
          
          response.on('data', (chunk) => {
              data += chunk;
          });

          response.on('end', async () => {
              this.logger.log(`CSV Descargado. Tamaño: ${(data.length / 1024 / 1024).toFixed(2)} MB. Procesando...`);
              
              // Evitar lineas iniciales del SAT (El SAT a veces pone 2 lineas de título antes de los headers)
              // Limpiamos los primeros renglones que no tengan RFC formato
              const lines = data.split('\n');
              let startIndex = 0;
              for(let i=0; i<lines.length; i++) {
                 if(lines[i].includes('RFC') && lines[i].includes('Nombre del Contribuyente')) {
                    startIndex = i;
                    break;
                 }
              }

              const cleanCsv = lines.slice(startIndex).join('\n');

              papaparse.parse(cleanCsv, {
                  header: true,
                  skipEmptyLines: true,
                  complete: async (results) => {
                      const records = results.data as any[];
                      const validRecords = [];

                      // SAT Columns typically:
                      // "No.", "RFC", "Nombre del Contribuyente", "Situación del contribuyente", etc.
                      const rfcKey = Object.keys(records[0] || {}).find(k => k.trim().toUpperCase() === 'RFC');
                      const nameKey = Object.keys(records[0] || {}).find(k => k.trim().toUpperCase().includes('NOMBRE'));
                      const sitKey = Object.keys(records[0] || {}).find(k => k.trim().toUpperCase().includes('SITUAC'));

                      if (!rfcKey) return reject(new Error("Formato del CSV del SAT ha cambiado (RFC no hallado)"));

                      // Extraer RFCs únicos para evitar violaciones de llave única
                      const seenRfcs = new Set();

                      for (const record of records) {
                          const row = record as any;
                          let rfc = String(rfcKey ? row[rfcKey] : "").trim();
                          let nombre = String(nameKey ? row[nameKey] : (row['Nombre del Contribuyente'] || "")).trim();
                          let situacion = String(sitKey ? row[sitKey] : (row['Situación del contribuyente'] || "")).trim();

                          if (!rfc || rfc.length < 12 || seenRfcs.has(rfc)) continue;
                          
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
                  error: (error: any) => {
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

  async verifyRfc(rfc: string): Promise<boolean> {
      if(!rfc) return false;
      const efo = await this.prisma.efosRecord.findUnique({
          where: { rfc: rfc.toUpperCase() }
      });
      return !!efo;
  }
}
