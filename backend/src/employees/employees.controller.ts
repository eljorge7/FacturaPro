import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.employeesService.create(tenantId, data);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './public/uploads/avatars';
        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
  }))
  uploadAvatar(
    @Headers('x-tenant-id') tenantId: string, 
    @Param('id') id: string, 
    @UploadedFile() file: any
  ) {
    if (!file) throw new BadRequestException('Falta la imagen');
    return this.employeesService.updateAvatar(tenantId, id, `/uploads/avatars/${file.filename}`);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './public/uploads/documents';
        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
  }))
  uploadDocument(
    @Headers('x-tenant-id') tenantId: string, 
    @Param('id') id: string,
    @Body('name') name: string,
    @UploadedFile() file: any
  ) {
    if (!file) throw new BadRequestException('Falta el archivo');
    // Using original name or user provided name
    const docName = name || file.originalname;
    return this.employeesService.addDocument(tenantId, id, docName, `/uploads/documents/${file.filename}`);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.employeesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.employeesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.employeesService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.employeesService.remove(tenantId, id);
  }
}
