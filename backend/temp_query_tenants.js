const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      storeSlug: true,
      syscomClientId: true
    }
  });
  console.log(tenants);
}

main().finally(() => prisma.$disconnect());
