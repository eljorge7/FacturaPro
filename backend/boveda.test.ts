import { Fiel, HttpsWebClient, Service, ServiceEndpoints, QueryParameters, DateTimePeriod, DateTime, DownloadType, RequestType } from '@nodecfdi/sat-ws-descarga-masiva';
import * as fs from 'fs';

async function run() {
  try {
     const cerBytes = fs.readFileSync('./src/cfdi/xml-generator/pruebas.cer').toString('utf8'); // Wait, fiel uses pure cer or pem?
     // Let's just log what Fiel constructor needs
     console.log(Fiel.create);
  } catch(e) {
     console.log(e);
  }
}
run();
