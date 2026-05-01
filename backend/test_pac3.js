const fs = require('fs');

async function test() {
  const envFile = fs.readFileSync('.env', 'utf8');
  let token = '';
  envFile.split('\n').forEach(line => {
    if (line.startsWith('SW_SAPIENS_TOKEN=')) token = line.split('=')[1].replace(/"/g, '').trim();
  });

  const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0"></cfdi:Comprobante>`;

  const formData = new FormData();
  formData.append('xml', new Blob([validXml], { type: 'text/xml' }), 'factura.xml');

  const response = await fetch('https://services.test.sw.com.mx/v4/cfdi33/stamp/v4', {
    method: 'POST',
    headers: {
        'Authorization': `bearer ${token}`
    },
    body: formData
  });

  console.log("FormData:", response.status, await response.text());
}

test();
