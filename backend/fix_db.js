const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.updateMany({
    data: {
      subscriptionEndsAt: new Date('2030-01-01'),
      availableStamps: 99999
    }
  });
  console.log('Tenants subscriptions extended to 2030!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
