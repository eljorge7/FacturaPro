const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Configurando Tenant a 3 Timbres (Tier EMPRENDEDOR)...");
  const tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.log("Error: No tenant found.");
    return;
  }

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionTier: 'EMPRENDEDOR',
      availableStamps: 3,
      hasExpenseControl: false,
      hasApiAccess: false
    }
  });

  console.log("Tenant Configurado:", {
    name: updated.name,
    tier: updated.subscriptionTier,
    stamps: updated.availableStamps
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
