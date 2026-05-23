const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { storeSlug: 'radiotec' } });
  if (!tenant) {
    console.log("Tenant not found");
    return;
  }
  
  console.log("Tenant:", tenant.name);
  console.log("Syscom Client ID:", tenant.syscomClientId);
  console.log("Syscom Secret Length:", tenant.syscomClientSecret?.length);

  try {
    console.log("Requesting Syscom Token...");
    const response = await axios.post('https://developers.syscom.mx/oauth/token', new URLSearchParams({
      client_id: tenant.syscomClientId,
      client_secret: tenant.syscomClientSecret,
      grant_type: 'client_credentials'
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    console.log("Token:", response.data.access_token?.substring(0, 10) + "...");
    
    console.log("Requesting products...");
    const res = await axios.get(`https://developers.syscom.mx/api/v1/productos?pagina=1`, {
      headers: { Authorization: `Bearer ${response.data.access_token}` }
    });
    
    console.log("Products found:", res.data.productos?.length);
    
  } catch (error) {
    console.error("Syscom Error:", error.response?.data || error.message);
  }
}

main().finally(() => prisma.$disconnect());
