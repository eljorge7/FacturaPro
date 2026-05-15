const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { email: 'carlos.paez@radiotecpro.com' },
    include: { employeeProfile: true }
  });
  console.log(JSON.stringify(users, null, 2));

  const profile = await prisma.employeeProfile.findFirst({
    where: { email: 'carlos.paez@radiotecpro.com' }
  });
  console.log("PROFILE BY EMAIL:");
  console.log(JSON.stringify(profile, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
