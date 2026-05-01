const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const profile = await prisma.taxProfile.findFirst();
    console.log(profile ? {
        id: profile.id,
        cerBase64: profile.cerBase64 ? 'SUBIDO' : 'VACIO',
        keyBase64: profile.keyBase64 ? 'SUBIDO' : 'VACIO',
        keyPassword: profile.keyPassword ? 'SUBIDO' : 'VACIO'
    } : 'No hay perfiles');
}

main().catch(console.error).finally(() => prisma.$disconnect());
