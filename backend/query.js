const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.customer.findMany({ 
    where: { legalName: { contains: 'Chalina', mode: 'insensitive' } } 
  });
  console.log("Customers FacturaPro:", c);
}

run().catch(console.error).finally(() => prisma.$disconnect());
