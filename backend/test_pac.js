const fs = require('fs');

async function test() {
  const envFile = fs.readFileSync('.env', 'utf8');
  let token = '';
  const lines = envFile.split('\n');
  for (const line of lines) {
    if (line.startsWith('SW_SAPIENS_TOKEN=')) {
      token = line.substring('SW_SAPIENS_TOKEN='.length).replace(/"/g, '').trim();
    }
  }

  const xmlStr = '<cfdi:Comprobante></cfdi:Comprobante>';

  const urls = [
    'https://services.test.sw.com.mx/v3/cfdi33/stamp/',
    'https://services.test.sw.com.mx/v3/cfdi33/stamp/v4',
    'https://services.test.sw.com.mx/v4/cfdi33/stamp/v4'
  ];

  for(const url of urls) {
    let response = await fetch(url, {
      method: 'POST',
      headers: {
          'Authorization': `bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xml: xmlStr })
    });
    let text = await response.text();
    console.log("URL:", url, "Status:", response.status, "Resp:", text);
  }
}

test();
