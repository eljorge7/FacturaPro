import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function test() {
    const tenantId = 'fb575bf1-f31e-49ce-9ddc-3ab301f061b9'; // Jorge's tenant from earlier
    const data = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@radiotecpro.com',
        password: 'password123',
        role: 'CASHIER',
        createSystemAccess: true
    };

    let userId = null;
    if (data.createSystemAccess && data.email && data.password && data.role) {
        const hash = await bcrypt.hash(data.password, 10);
        const newUser = await prisma.user.create({
            data: {
                tenantId,
                email: data.email,
                passwordHash: hash,
                name: `${data.firstName} ${data.lastName}`,
                role: data.role
            }
        });
        userId = newUser.id;
        console.log("User created:", newUser.id);
    }

    const emp = await prisma.employeeProfile.create({
        data: {
            tenantId,
            userId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email
        }
    });
    console.log("Employee created:", emp.id);

    // Now try to log in
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    const isMatch = await bcrypt.compare(data.password, user!.passwordHash);
    console.log("Login successful?", isMatch);
}

test().catch(console.error).finally(() => prisma.$disconnect());
