import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';

import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'supersecret' })],
  providers: [EmployeesService],
  controllers: [EmployeesController]
})
export class EmployeesModule {}
