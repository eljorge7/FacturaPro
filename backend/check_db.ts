import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, name: true, tenantId: true }
    });
    console.log("=== USERS ===");
    console.log(users);

    const emps = await prisma.employeeProfile.findMany({
        select: { id: true, email: true, userId: true, firstName: true, lastName: true }
    });
    console.log("=== EMPLOYEES ===");
    console.log(emps);
}

check().then(() => prisma.$disconnect());
