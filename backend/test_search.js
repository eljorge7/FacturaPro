const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function run() {
  try {
    const tenant = await prisma.tenant.findFirst({ where: { syscomClientId: { not: null } } });
    if (!tenant) {
      console.log("No tenant found with syscom credentials");
      return;
    }

    console.log("Using tenant:", tenant.id);

    const authRes = await axios.post('https://developers.syscom.mx/oauth/token', new URLSearchParams({
      client_id: (tenant.syscomClientId || '').trim(),
      client_secret: (tenant.syscomClientSecret || '').trim(),
      grant_type: 'client_credentials'
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = authRes.data.access_token;
    console.log("Got token!");

    const searchString = "eño / MCBF 5,000,000 / Pintura AV AntiEstática y Calibre Grueso en Gabinete";
    
    // 1. Exact string URL Encoded
    const res1 = await axios.get(`https://developers.syscom.mx/api/v1/productos?pagina=1&busqueda=${encodeURIComponent(searchString)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("1. Exact string:");
    console.log(res1.data.productos.map(p => p.modelo));

    // 2. Cleaned string
    const cleaned = searchString.replace(/[\/\-\,\.\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
    const res2 = await axios.get(`https://developers.syscom.mx/api/v1/productos?pagina=1&busqueda=${encodeURIComponent(cleaned)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("\n2. Cleaned string:");
    console.log(res2.data.productos.map(p => p.modelo));
    
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
