import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.employeeProfile.findMany({
      where: { tenantId },
      include: {
        user: { select: { email: true, role: true, warehouse: { select: { id: true, name: true } } } },
        documents: true,
        departmentRef: { select: { id: true, name: true } }
      },
      orderBy: { firstName: 'asc' }
    });
  }

  async findOne(tenantId: string, id: string) {
    const emp = await this.prisma.employeeProfile.findFirst({
      where: { tenantId, id },
      include: {
         user: { select: { email: true, role: true, warehouseId: true } },
         documents: true,
         departmentRef: { select: { id: true, name: true } }
      }
    });
    if (!emp) throw new NotFoundException('Empleado no encontrado');
    return emp;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
       let userId = null;

       // Si se solicita aprovisionar acceso al ERP
       if (data.createSystemAccess && data.email && data.password && data.role) {
          const cleanEmail = data.email.trim().toLowerCase();
          const cleanPassword = data.password.trim();
          
          const existingUser = await tx.user.findUnique({ where: { email: cleanEmail } });
          if (existingUser) throw new BadRequestException('El correo ya está en uso por otro usuario.');

          const hash = await bcrypt.hash(cleanPassword, 10);
          const newUser = await tx.user.create({
             data: {
                tenantId,
                email: cleanEmail,
                passwordHash: hash,
                name: `${data.firstName} ${data.lastName}`,
                role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                warehouseId: data.warehouseId || null
             }
          });
          userId = newUser.id;
       }

       return tx.employeeProfile.create({
          data: {
             tenantId,
             userId,
             firstName: data.firstName,
             lastName: data.lastName,
             phone: data.phone,
             email: data.email ? data.email.trim().toLowerCase() : null, // Guardamos también en el perfil
             employeeNumber: data.employeeNumber,
             departmentId: data.departmentId || null,
             jobTitle: data.jobTitle,
             employeeType: data.employeeType || 'DIRECT',
             rfc: data.rfc,
             nss: data.nss,
             curp: data.curp,
             baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
             hireDate: data.hireDate ? new Date(data.hireDate) : null,
             shirtSize: data.shirtSize,
             pantsSize: data.pantsSize,
             shoeSize: data.shoeSize,
             bloodType: data.bloodType,
             emergencyContact: data.emergencyContact
          }
       });
    });
  }

  async createBulk(tenantId: string, employeesData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const createdCount = { users: 0, profiles: 0 };
      
      for (const data of employeesData) {
        let userId = null;

        if (data.createSystemAccess && data.email && data.password && data.role) {
           const existingUser = await tx.user.findUnique({ where: { email: data.email } });
           if (!existingUser) {
              const hash = await bcrypt.hash(data.password, 10);
              const newUser = await tx.user.create({
                 data: {
                    tenantId,
                    email: data.email,
                    passwordHash: hash,
                    name: `${data.firstName} ${data.lastName}`,
                    role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                    customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                    warehouseId: data.warehouseId || null
                 }
              });
              userId = newUser.id;
              createdCount.users++;
           }
        }

        await tx.employeeProfile.create({
           data: {
              tenantId,
              userId,
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone ? String(data.phone) : null,
              email: data.email || null,
              employeeNumber: data.employeeNumber || null,
              departmentId: data.departmentId || null,
              jobTitle: data.jobTitle || null,
              employeeType: data.employeeType || 'DIRECT',
              rfc: data.rfc || null,
              nss: data.nss ? String(data.nss) : null,
              curp: data.curp || null,
              baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
              hireDate: data.hireDate ? new Date(data.hireDate) : null,
              shirtSize: data.shirtSize || null,
              pantsSize: data.pantsSize || null,
              shoeSize: data.shoeSize || null,
              bloodType: data.bloodType || null,
              emergencyContact: data.emergencyContact || null
           }
        });
        createdCount.profiles++;
      }
      return createdCount;
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const emp = await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
        let newUserId = emp.userId;

        // Si ya tenía acceso, actualizar rol y/o contraseña
        if (emp.userId && data.role) {
            const updateData: any = {
               role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
               customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
               warehouseId: data.warehouseId || null
            };
            
            if (data.password) {
                updateData.passwordHash = await bcrypt.hash(data.password.trim(), 10);
            }

            await tx.user.update({
                where: { id: emp.userId },
                data: updateData
            });
        } 
        // Si no tenía acceso y ahora se lo quieren dar
        else if (!emp.userId && data.createSystemAccess && data.email && data.password && data.role) {
            const cleanEmail = data.email.trim().toLowerCase();
            const cleanPassword = data.password.trim();

            const existingUser = await tx.user.findUnique({ where: { email: cleanEmail } });
            if (existingUser) throw new BadRequestException('El correo ya está en uso por otro usuario.');

            const hash = await bcrypt.hash(cleanPassword, 10);
            const newUser = await tx.user.create({
               data: {
                  tenantId,
                  email: cleanEmail,
                  passwordHash: hash,
                  name: `${data.firstName || emp.firstName} ${data.lastName || emp.lastName}`,
                  role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                  customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                  warehouseId: data.warehouseId || null
               }
            });
            newUserId = newUser.id;
        }

        return tx.employeeProfile.update({
            where: { id },
            data: {
                userId: newUserId,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email ? data.email.trim().toLowerCase() : null,
                employeeNumber: data.employeeNumber,
                departmentId: data.departmentId || null,
                jobTitle: data.jobTitle,
                employeeType: data.employeeType || undefined,
                rfc: data.rfc,
                nss: data.nss,
                curp: data.curp,
                baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : undefined,
                hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
                isActive: data.isActive !== undefined ? data.isActive : undefined,
                shirtSize: data.shirtSize !== undefined ? data.shirtSize : undefined,
                pantsSize: data.pantsSize !== undefined ? data.pantsSize : undefined,
                shoeSize: data.shoeSize !== undefined ? data.shoeSize : undefined,
                bloodType: data.bloodType !== undefined ? data.bloodType : undefined,
                emergencyContact: data.emergencyContact !== undefined ? data.emergencyContact : undefined
            }
        });
    });
  }

  async updateAvatar(tenantId: string, id: string, avatarUrl: string) {
    const emp = await this.findOne(tenantId, id);
    return this.prisma.employeeProfile.update({
       where: { id },
       data: { avatarUrl }
    });
  }

  async remove(tenantId: string, id: string) {
    const emp = await this.findOne(tenantId, id);
    if (emp.userId) {
       // Disable system access but do not delete user to preserve relational history
       await this.prisma.user.update({
           where: { id: emp.userId },
           data: { passwordHash: 'DISABLED' }
       });
    }
    return this.prisma.employeeProfile.update({
        where: { id },
        data: { isActive: false }
    });
  }

  async addDocument(tenantId: string, id: string, name: string, fileUrl: string) {
    const emp = await this.findOne(tenantId, id);
    return this.prisma.employeeDocument.create({
      data: {
        employeeId: emp.id,
        name,
        fileUrl
      }
    });
  }

  async getPortalData(tenantId: string, userId: string) {
    const employee = await this.prisma.employeeProfile.findUnique({
      where: { userId }
    });

    if (!employee || employee.tenantId !== tenantId) {
      return { isEmployee: false, message: 'Perfil de empleado no encontrado' };
    }

    const payslips = await this.prisma.payslip.findMany({
      where: { employeeId: employee.id, status: 'PAID' },
      include: { payrollRun: true },
      orderBy: { createdAt: 'desc' }
    });

    const documents = await this.prisma.employeeDocument.findMany({
      where: { employeeId: employee.id },
      orderBy: { uploadedAt: 'desc' }
    });

    const timeOffRequests = await this.prisma.timeOffRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' }
    });

    return {
      employee,
      payslips,
      documents,
      timeOffRequests
    };
  }

  async createTimeOffRequest(tenantId: string, userId: string, data: any) {
    const employee = await this.prisma.employeeProfile.findUnique({
      where: { userId }
    });

    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException('Perfil de empleado no encontrado para este usuario');
    }

    if (!data.type || !data.startDate || !data.endDate) {
      throw new BadRequestException('Tipo, fecha de inicio y fecha de fin son obligatorios');
    }

    return this.prisma.timeOffRequest.create({
      data: {
        tenantId,
        employeeId: employee.id,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason || null,
        status: 'PENDING'
      }
    });
  }
}
