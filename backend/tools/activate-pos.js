const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.tenant.updateMany({ data: { hasPosAccess: true } });
  console.log('POS Activated!');
  process.exit(0);
})();
