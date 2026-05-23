const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.tenant.updateMany({
    data: {
      hasStoreAccess: true,
      subscriptionTier: 'CORPORATIVO'
    }
  });
  console.log('Unlocked!');
}
main();
