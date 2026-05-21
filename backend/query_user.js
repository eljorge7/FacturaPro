const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'jorge.hurtado@radiotecpro.com' }
  });
  console.log(user);
}
main().finally(() => prisma.$disconnect());
