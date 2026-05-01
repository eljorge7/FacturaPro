const fs = require('fs');

async function test() {
  const envFile = fs.readFileSync('.env', 'utf8');
  let token = '';
  envFile.split('\n').forEach(line => {
    if (line.startsWith('SW_SAPIENS_TOKEN=')) token = line.split('=')[1].replace(/"/g, '').trim();
  });

  const xmlBase64 = Buffer.from('<cfdi:Comprobante></cfdi:Comprobante>').toString('base64');

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="xml"\r\n\r\n`;
  body += `${xmlBase64}\r\n`;
  body += `--${boundary}--`;

  const response = await fetch('https://services.test.sw.com.mx/v4/cfdi33/stamp/v4/b64', {
    method: 'POST',
    headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  console.log("multipart/form-data (v4/b64):", response.status, await response.text());
  
  // also try the normal stamp endpoint
  let body2 = `--${boundary}\r\n`;
  body2 += `Content-Disposition: form-data; name="xml"; filename="test.xml"\r\n`;
  body2 += `Content-Type: text/xml\r\n\r\n`;
  body2 += `<cfdi:Comprobante></cfdi:Comprobante>\r\n`;
  body2 += `--${boundary}--`;

  const response2 = await fetch('https://services.test.sw.com.mx/v4/cfdi33/stamp/v4', {
    method: 'POST',
    headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body2
  });
  console.log("multipart form-data file:", response2.status, await response2.text());
}

test();
