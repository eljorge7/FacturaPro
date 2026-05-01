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
          const existingUser = await tx.user.findUnique({ where: { email: data.email } });
          if (existingUser) throw new BadRequestException('El correo ya está en uso por otro usuario.');

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
       }

       return tx.employeeProfile.create({
          data: {
             tenantId,
             userId,
             firstName: data.firstName,
             lastName: data.lastName,
             phone: data.phone,
             email: data.email || null, // Guardamos también en el perfil
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

  async update(tenantId: string, id: string, data: any) {
    const emp = await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
        // Actualizar datos del ERP si tiene acceso linkeado
        if (emp.userId && data.role) {
            await tx.user.update({
                where: { id: emp.userId },
                data: {
                   role: data.role === 'CUSTOM' ? 'CUSTOM' : data.role,
                   customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
                   warehouseId: data.warehouseId || null
                }
            });
        }

        return tx.employeeProfile.update({
            where: { id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email !== undefined ? data.email : undefined,
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
}
