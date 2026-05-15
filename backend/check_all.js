const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const profiles = await prisma.employeeProfile.findMany();
  console.log("PROFILES:");
  console.log(JSON.stringify(profiles, null, 2));

  const users = await prisma.user.findMany();
  console.log("USERS:");
  users.forEach(u => {
    console.log(u.email, u.name, u.role, u.id);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
