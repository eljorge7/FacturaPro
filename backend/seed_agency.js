const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando inyección de Agencia Contable para Pruebas...");

    // Encontrar al primer usuario (El administrador principal)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("🚨 No hay usuarios registrados localmente");
        return;
    }

    console.log(`👤 Usuario detectado: ${user.name} (${user.email})`);

    // 1. Crear Agencia
    let agency = await prisma.accountantAgency.findFirst({ where: { billingEmail: "despacho@facturapro.com" }});
    if (!agency) {
       agency = await prisma.accountantAgency.create({
          data: {
             name: "Despacho Corporativo MAJIA",
             billingEmail: "despacho@facturapro.com"
          }
       });
       console.log("🏛️ Agencia Contable Creada!");
    } else {
       console.log("🏛️ Agencia ya existía.");
    }

    // Actualizar al Tenant primario del usuario para atarlo a la Agencia (Opcional, pero util para facturación agrupada)
    await prisma.tenant.update({
       where: { id: user.tenantId },
       data: { agencyId: agency.id }
    });

    // 2. Crear Clientes Falsos (Tenants)
    const clientesNombres = ["Vulcanizadora El Yori", "ISOTEC Systems SA de CV"];
    
    for (const nombre of clientesNombres) {
       const suffix = Math.floor(Math.random() * 1000);
       let tenant = await prisma.tenant.findUnique({ where: { name: nombre }});
       
       if (!tenant) {
           tenant = await prisma.tenant.create({
              data: {
                 name: nombre,
                 domain: `${nombre.replace(/ /g, '').toLowerCase()}${suffix}`,
                 subscriptionTier: "PYME",
                 hasExpenseControl: true,
                 agencyId: agency.id,
                 phone: "526620000000"
              }
           });
           console.log(`🏢 Cliente PyME creado: ${nombre}`);
       }

       // 3. Vincular al Contador (WorkspaceMember)
       const ws = await prisma.workspaceMember.findUnique({
          where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } }
       });
       if (!ws) {
          await prisma.workspaceMember.create({
             data: {
                userId: user.id,
                tenantId: tenant.id,
                role: "ACCOUNTANT"
             }
          });
          console.log(`🔗 Vínculo contable otorgado para ver a ${nombre}`);
       }
    }

    console.log("✨ Seed Finalizado con Éxito. ¡Refresca tu pantalla web!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
