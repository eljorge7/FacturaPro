import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async requestOtp(data: any) {
    const { name, email, password, legalName, tradeName, phone } = data;
    
    if (!name || !email || !password || !legalName || !phone) {
      throw new BadRequestException('Faltan campos obligatorios');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El correo ya está en uso');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    
    let formattedPhone = phone.replace(/\D/g, ''); 
    if (formattedPhone.length === 10) formattedPhone = `521${formattedPhone}`;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save to OtpVerification
    const otpData = { name, email, passwordHash, legalName, tradeName, phone: formattedPhone };
    await (this.prisma as any).otpVerification.upsert({
      where: { phone: formattedPhone },
      update: { code, expiresAt, data: otpData },
      create: { phone: formattedPhone, code, expiresAt, data: otpData }
    });

    // Send WhatsApp (OmniChat)
    try {
        const omniUrl = process.env.OMNICHAT_API_URL || 'https://omnichat.radiotecpro.com/api';
        const msg = `🔐 *FacturaPro*\n\nHola ${name}, tu código de verificación es:\n*${code}*\n\n_Válido por 15 minutos._`;
        fetch(`${omniUrl}/api/v1/messages/send`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer sk_24af03088b47aac20bae7b1df07f8399',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone: formattedPhone, text: msg })
        }).catch(e => console.error(e));
    } catch(e) {}

    return { success: true, message: 'OTP enviado' };
  }

  async verifyOtp(payload: { phone: string, code: string }) {
    let formattedPhone = payload.phone.replace(/\D/g, ''); 
    if (formattedPhone.length === 10) formattedPhone = `521${formattedPhone}`;

    const otpRecord = await (this.prisma as any).otpVerification.findUnique({
      where: { phone: formattedPhone }
    });

    if (!otpRecord) throw new BadRequestException('No hay registro pendiente para este número');
    if (otpRecord.code !== payload.code) throw new BadRequestException('Código incorrecto');
    if (new Date() > new Date(otpRecord.expiresAt)) throw new BadRequestException('El código expiró');

    const data = otpRecord.data as any;

    return this.prisma.$transaction(async (tx) => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await tx.tenant.create({
        data: {
          name: data.legalName,
          tradeName: data.tradeName || null,
          phone: data.phone,
          domain: data.legalName.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4),
          subscriptionTier: 'TRIAL',
          availableStamps: 5,
          subscriptionEndsAt: trialEndsAt
        } as any
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          role: 'OWNER',
          tenantId: tenant.id
        }
      });

      // Clear OTP
      await (tx as any).otpVerification.delete({ where: { phone: formattedPhone } });

      const jwtPayload = { userId: user.id, email: user.email, tenantId: tenant.id };
      const token = this.jwtService.sign(jwtPayload);

      return {
        token,
        tenantId: tenant.id,
        user: { id: user.id, name: user.name, email: user.email, avatar: (user as any).avatar }
      };
    });
  }

  async login(data: any) {
    const { email, password } = data;
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.passwordHash === 'SSO_MANAGED') {
      throw new UnauthorizedException('Esta cuenta está enlazada al Control Central. Inicia sesión desde tu portal de administración (RentControl/OmniChat).');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { userId: user.id, email: user.email, tenantId: user.tenantId };
    const token = this.jwtService.sign(payload);

    return {
      token,
      tenantId: user.tenantId,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    };
  }

  async sso(data: any) {
    const { email, name, phone, legalName } = data;
    if (!email) throw new BadRequestException('Email requerido para SSO');

    let user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        user = await this.prisma.$transaction(async (tx) => {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);
            
            const tenant = await tx.tenant.create({
                data: {
                    name: legalName || name || "Usuario Sincronizado",
                    phone: phone || "0000000000",
                    domain: (legalName || name || 'tenant').toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4),
                    subscriptionTier: 'TRIAL',
                    availableStamps: 5,
                    subscriptionEndsAt: trialEndsAt
                } as any
            });

            const newUser = await tx.user.create({
                data: {
                    email: email,
                    name: name || email.split('@')[0],
                    passwordHash: 'SSO_MANAGED',
                    role: 'OWNER',
                    tenantId: tenant.id
                }
            });
            return newUser;
        });
    }

    const payload = { userId: user.id, email: user.email, tenantId: user.tenantId };
    const token = this.jwtService.sign(payload);

    return {
      token,
      tenantId: user.tenantId,
      user: { id: user.id, name: user.name, email: user.email, avatar: (user as any).avatar }
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: (user as any).avatar,
      birthDate: (user as any).birthDate,
      tradeName: user.tenant?.tradeName,
      phone: user.tenant?.phone
    };
  }

  async updateProfile(userId: string, data: any) {
    const { name, email, password, avatar, birthDate, tradeName, phone } = data;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;
    if (birthDate !== undefined) {
      updateData.birthDate = birthDate ? new Date(birthDate) : null;
    }
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const tempUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!tempUser) throw new UnauthorizedException('Usuario no encontrado');
    
    return await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      if (tradeName !== undefined || phone !== undefined) {
        const tenantUpdate: any = {};
        if (tradeName !== undefined) tenantUpdate.tradeName = tradeName;
        if (phone !== undefined) tenantUpdate.phone = phone;
        
        await tx.tenant.update({
          where: { id: tempUser.tenantId },
          data: tenantUpdate
        });
      }
      
      return { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        avatar: (updatedUser as any).avatar,
        birthDate: (updatedUser as any).birthDate
      };
    });
  }

  // === MULTI-TENANT ACCOUNTANT AGENCY METHODS ===

  async getMemberships(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        tenant: {
          select: { id: true, name: true, tradeName: true, subscriptionTier: true, agencyId: true }
        }
      }
    });

    const agencyRoles = await this.prisma.agencyMember.findMany({
      where: { userId },
      include: { agency: true }
    });

    const isAgencyAdmin = agencyRoles.some(r => r.role === 'OWNER' || r.role === 'MANAGER');
    
    // Also include their primary tenant as a standard membership
    const primaryUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: { select: { id: true, name: true, tradeName: true, subscriptionTier: true, agencyId: true } }
      }
    });

    return {
      primaryTenant: primaryUser?.tenant,
      agencyMemberships: memberships.map(m => m.tenant),
      isAgencyAdmin,
      agencyDetails: isAgencyAdmin ? agencyRoles[0]?.agency : null
    };
  }

  async getAgencyTeam(userId: string) {
    const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
    const adminRole = roles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
    
    if (!adminRole) throw new UnauthorizedException('No eres administrador de ninguna agencia.');

    const team = await this.prisma.agencyMember.findMany({
      where: { agencyId: adminRole.agencyId },
      include: {
        user: {
           select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return team.map(member => ({
      id: member.id,
      role: member.role,
      user: member.user,
      joinedAt: member.createdAt
    }));
  }

  async switchTenant(userId: string, targetTenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no válido');

    if (user.tenantId === targetTenantId) {
      // Trying to switch back to primary
      const payload = { userId: user.id, email: user.email, tenantId: user.tenantId };
      return { token: this.jwtService.sign(payload), tenantId: user.tenantId };
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_tenantId: { userId, tenantId: targetTenantId } }
    });

    if (!membership) {
      throw new UnauthorizedException('No tienes permisos contables ni de agencia sobre esta empresa.');
    }

    const payload = { userId: user.id, email: user.email, tenantId: targetTenantId, isAgencyMode: true };
    return { token: this.jwtService.sign(payload), tenantId: targetTenantId };
  }

  async inviteAgencyMember(adminUserId: string, email: string, role: string, name: string) {
    const adminRoles = await this.prisma.agencyMember.findMany({ where: { userId: adminUserId } });
    const agencyRole = adminRoles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
    if (!agencyRole) throw new UnauthorizedException('No tienes permisos en esta agencia.');

    // 1. Validate if user exists
    let user = await this.prisma.user.findUnique({ where: { email } });
    
    // 2. Si no existe, lo creamos (Shadow user)
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: 'TEMPORARY_AGENCY_PASSWORD_' + Math.random().toString(36).substring(7),
          name,
          tenant: {
            create: {
               name: "Bóveda Personal " + name,
            }
          }
        }
      });
      // AQUI se enviaría un correo electrónico SMTP tipo "SendGrid" con su token mágico para establecer su contraseña final.
    }

    // 3. Afiliar a la agencia
    const existing = await this.prisma.agencyMember.findFirst({
      where: { userId: user.id, agencyId: agencyRole.agencyId }
    });

    if (existing) {
      return { message: "El contador ya forma parte de tu agencia." };
    }

    const newMember = await this.prisma.agencyMember.create({
      data: {
        userId: user.id,
        agencyId: agencyRole.agencyId,
        role: role
      },
      include: { user: true }
    });

    return { success: true, member: newMember };
  }

  async assignWorkspaceTenants(adminUserId: string, targetStaffId: string, tenantIds: string[]) {
    // 1. Verify admin has rights
    const adminRoles = await this.prisma.agencyMember.findMany({ where: { userId: adminUserId } });
    const agencyRole = adminRoles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
    if (!agencyRole) throw new UnauthorizedException('No tienes permisos en esta agencia.');

    // 2. Get the target staff member
    const staff = await this.prisma.agencyMember.findFirst({
       where: { id: targetStaffId, agencyId: agencyRole.agencyId }
    });
    if (!staff) throw new UnauthorizedException('El empleado no existe en tu agencia.');

    // 3. Limpiar permisos viejos
    await this.prisma.workspaceMember.deleteMany({
       where: { userId: staff.userId }
    });

    // 4. Assign new tenants
    for (const tId of tenantIds) {
       await this.prisma.workspaceMember.upsert({
         where: { userId_tenantId: { userId: staff.userId, tenantId: tId } },
         update: { role: 'STAFF' },
         create: { userId: staff.userId, tenantId: tId, role: 'STAFF' }
       });
    }

    return { success: true, assignedCount: tenantIds.length };
  }

  // === AGENCY EXECUTIVE METRICS ===
  async getAgencyMetrics(userId: string) {
    const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
    const adminRole = roles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
    if (!adminRole) throw new UnauthorizedException('No tienes permisos de administrador');

    const agencyId = adminRole.agencyId;
    const agency = await this.prisma.accountantAgency.findUnique({
      where: { id: agencyId },
      include: { tenants: { select: { id: true, name: true, subscriptionEndsAt: true, subscriptionTier: true } } }
    });
    if (!agency) throw new BadRequestException('Agencia no encontrada');

    const tenantIds = agency.tenants.map(t => t.id);

    // 1. CFDI Consumption
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const timbresMensuales = await this.prisma.invoice.count({
      where: {
         tenantId: { in: tenantIds },
         status: { in: ['TIMBRADA', 'VIGENTE', 'PAID'] },
         date: { gte: startOfMonth }
      }
    });

    const timbresHistoricos = await this.prisma.invoice.count({
      where: {
         tenantId: { in: tenantIds },
         status: { in: ['TIMBRADA', 'VIGENTE', 'PAID'] }
      }
    });

    // 2. Tasks Stats
    const tasks = await this.prisma.agencyTask.findMany({
       where: { agencyId },
       include: { assignedTo: { select: { id: true, name: true, avatar: true } } }
    });

    const staffProductivity: Record<string, { done: number; total: number }> = {};
    const globalTasks = { total: tasks.length, done: 0, pending: 0, in_progress: 0, review: 0 };

    tasks.forEach(task => {
        if (task.status === 'DONE') globalTasks.done++;
        else if (task.status === 'IN_PROGRESS') globalTasks.in_progress++;
        else if (task.status === 'REVIEW') globalTasks.review++;
        else globalTasks.pending++;

        const staffName = task.assignedTo ? task.assignedTo.name.split(' ')[0] : 'Sin Asignar';
        if (!staffProductivity[staffName]) {
           staffProductivity[staffName] = { done: 0, total: 0 };
        }
        staffProductivity[staffName].total++;
        if (task.status === 'DONE') staffProductivity[staffName].done++;
    });

    const staffChart = Object.keys(staffProductivity).map(name => ({
        name,
        done: staffProductivity[name].done,
        pending: staffProductivity[name].total - staffProductivity[name].done
    }));

    // 3. Subscriptions
    const now = new Date();
    const alertDays = new Date();
    alertDays.setDate(alertDays.getDate() + 7);

    const subscriptions = {
       expired: agency.tenants.filter(t => t.subscriptionEndsAt && new Date(t.subscriptionEndsAt) < now).map(t => t.name),
       expiringSoon: agency.tenants.filter(t => t.subscriptionEndsAt && new Date(t.subscriptionEndsAt) >= now && new Date(t.subscriptionEndsAt) <= alertDays).map(t => t.name),
       active: agency.tenants.filter(t => !t.subscriptionEndsAt || new Date(t.subscriptionEndsAt) > alertDays).length
    };

    return {
       timbres: { mensual: timbresMensuales, historico: timbresHistoricos },
       tasks: globalTasks,
       staffChart,
       subscriptions,
       totalClientes: tenantIds.length,
       planAcumulado: agency.tenants.reduce((acc, t) => acc + (t.subscriptionTier === 'CORPORATIVO' ? 3000 : (t.subscriptionTier === 'PYME' ? 1500 : 500)), 0)
    };
  }

  // === AUTO-BILLING ENGINE (BATCH INVOICING) ===
  async generateAutoBills(userId: string) {
    const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
    const adminRole = roles.find(r => r.role === 'OWNER' || r.role === 'MANAGER');
    if (!adminRole) throw new UnauthorizedException('No tienes permisos de administrador de agencia');

    const primaryUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!primaryUser) throw new UnauthorizedException('Usuario corporativo no encontrado');
    const bovedaId = primaryUser.tenantId;

    const agency = await this.prisma.accountantAgency.findUnique({
      where: { id: adminRole.agencyId },
      include: { tenants: true }
    });

    if (!agency || agency.tenants.length === 0) {
      return { success: true, count: 0, message: "No hay clientes en la agencia." };
    }

    // 1. Get or Create TaxProfile for the Agency
    let taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId: bovedaId } });
    if (!taxProfile) {
      taxProfile = await this.prisma.taxProfile.create({
        data: {
           tenantId: bovedaId,
           rfc: 'XAXX010101000',
           legalName: 'MI DESPACHO CONTABLE (PENDIENTE DE CONFIGURAR)',
           taxRegime: '612',
           zipCode: '00000',
           pdfTemplate: 'Estándar - Estilo europeo'
        }
      });
    }

    let generatedCount = 0;

    // 2. Iterate agency endpoints
    for (const client of agency.tenants) {
       // Look up if this client already exists as a "Customer" in the Agency's Bóveda
       let customer = await this.prisma.customer.findFirst({
          where: { tenantId: bovedaId, legalName: client.name }
       });

       if (!customer) {
          customer = await this.prisma.customer.create({
             data: {
                tenantId: bovedaId,
                legalName: client.name,
                rfc: 'XAXX010101000',
                taxRegime: '601',
                zipCode: '00000',
                email: 'cliente@despacho.com',
                phone: client.phone || '0000000000'
             }
          });
       }

       // Calculate prices (Default 500, Pyme 1500, Corp 3000)
       const priceStr = client.subscriptionTier || 'BÁSICO';
       let subtotal = 500;
       if (priceStr === 'PYME') subtotal = 1500;
       if (priceStr === 'CORPORATIVO') subtotal = 3000;
       
       const taxRate = 0.16;
       const taxTotal = subtotal * taxRate;
       const total = subtotal + taxTotal;

       // Create DRAFT Invoice
       await this.prisma.invoice.create({
          data: {
             tenantId: bovedaId,
             taxProfileId: taxProfile.id,
             customerId: customer.id,
             invoiceNumber: `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
             date: new Date(),
             paymentMethod: 'PPD',
             paymentForm: '03',
             cfdiUse: 'G03',
             subtotal: subtotal,
             taxTotal: taxTotal,
             total: total,
             currency: 'MXN',
             status: 'DRAFT',
             items: {
                create: [{
                   description: `Iguala Contable Mensual - Plan ${priceStr}`,
                   quantity: 1,
                   unitPrice: subtotal,
                   taxRate: taxRate,
                   total: total
                }]
             }
          }
       });

       generatedCount++;
    }

    return { success: true, count: generatedCount, message: "Facturas generadas en Borrador" };
  }

  // === AGENCY TASKS ===
  async getAgencyTasks(userId: string) {
    const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
    if (roles.length === 0) return [];
    
    const agencyId = roles[0].agencyId;

    return this.prisma.agencyTask.findMany({
       where: { agencyId },
       include: {
         assignedTo: { select: { id: true, name: true, avatar: true } },
         tenant: { select: { id: true, name: true, tradeName: true } },
         agency: { select: { name: true } }
       },
       orderBy: { createdAt: 'desc' }
    });
  }

  async createAgencyTask(userId: string, body: any) {
    const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
    if (roles.length === 0) throw new UnauthorizedException('No tienes agencia');
    const agencyId = roles[0].agencyId;

    return this.prisma.agencyTask.create({
      data: {
         agencyId,
         title: body.title,
         description: body.description,
         status: body.status || 'TODO',
         dueDate: body.dueDate ? new Date(body.dueDate) : null,
         assignedToId: body.assignedToId || null,
         tenantId: body.tenantId || null
      }
    });
  }

  async updateAgencyTask(userId: string, taskId: string, body: any) {
    const roles = await this.prisma.agencyMember.findMany({ where: { userId } });
    if (roles.length === 0) throw new UnauthorizedException('No tienes agencia');
    const agencyId = roles[0].agencyId;

    const task = await this.prisma.agencyTask.findFirst({ where: { id: taskId, agencyId }});
    if (!task) throw new UnauthorizedException('Tarea no encontrada');

    return this.prisma.agencyTask.update({
      where: { id: taskId },
      data: {
         title: body.title !== undefined ? body.title : undefined,
         description: body.description !== undefined ? body.description : undefined,
         status: body.status !== undefined ? body.status : undefined,
         dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
         assignedToId: body.assignedToId !== undefined ? body.assignedToId : undefined,
         tenantId: body.tenantId !== undefined ? body.tenantId : undefined
      }
    });
  }
}
