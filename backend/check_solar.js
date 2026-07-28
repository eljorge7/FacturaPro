const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const q = await prisma.quote.findFirst({
    where: { quoteNumber: 'COT-379532' }
  });
  console.log("Found quote:", q ? q.id : null);
  console.log("solarData is:", q ? q.solarData : null);
}

main().catch(console.error).finally(() => prisma.$disconnect());
