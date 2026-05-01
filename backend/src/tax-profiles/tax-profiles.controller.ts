import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UnauthorizedException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TaxProfilesService } from './tax-profiles.service';
import { CreateTaxProfileDto } from './dto/create-tax-profile.dto';
import { UpdateTaxProfileDto } from './dto/update-tax-profile.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('tax-profiles')
export class TaxProfilesController {
  constructor(
     private readonly taxProfilesService: TaxProfilesService,
     private readonly jwtService: JwtService
  ) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cerFile', maxCount: 1 },
    { name: 'keyFile', maxCount: 1 },
  ]))
  create(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() data: any,
    @UploadedFiles() files: { cerFile?: any[], keyFile?: any[] }
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID requerido');

    let cerBase64 = null;
    let keyBase64 = null;

    if (files?.cerFile?.[0]) {
      cerBase64 = files.cerFile[0].buffer.toString('base64');
    }
    if (files?.keyFile?.[0]) {
      keyBase64 = files.keyFile[0].buffer.toString('base64');
    }

    return this.taxProfilesService.create({ 
      ...data, 
      tenantId,
      ...(cerBase64 ? { cerBase64 } : {}),
      ...(keyBase64 ? { keyBase64 } : {})
    });
  }

  @Get()
  findAll() {
    return this.taxProfilesService.findAll();
  }

  @Get('mine')
  async findMine(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.tenantId) throw new UnauthorizedException();
    return this.taxProfilesService.findMine(decoded.tenantId);
  }

  @Get('series')
  async getSeries(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.tenantId) throw new UnauthorizedException();
    return this.taxProfilesService.getSeries(decoded.tenantId);
  }

  @Post('series')
  async createSeries(@Headers('Authorization') auth: string, @Body() data: any) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.tenantId) throw new UnauthorizedException();
    return this.taxProfilesService.createSeries(decoded.tenantId, data);
  }

  @Patch('series/:id')
  async updateSeries(@Headers('Authorization') auth: string, @Param('id') id: string, @Body() data: any) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.tenantId) throw new UnauthorizedException();
    return this.taxProfilesService.updateSeries(decoded.tenantId, id, data);
  }

  @Delete('series/:id')
  async deleteSeries(@Param('id') id: string) {
    return this.taxProfilesService.deleteSeries(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taxProfilesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cerFile', maxCount: 1 },
    { name: 'keyFile', maxCount: 1 },
  ]))
  update(
    @Param('id') id: string, 
    @Body() updateTaxProfileDto: any,
    @UploadedFiles() files: { cerFile?: any[], keyFile?: any[] }
  ) {
    let cerBase64 = null;
    let keyBase64 = null;

    if (files?.cerFile?.[0]) {
      cerBase64 = files.cerFile[0].buffer.toString('base64');
    }
    if (files?.keyFile?.[0]) {
      keyBase64 = files.keyFile[0].buffer.toString('base64');
    }

    return this.taxProfilesService.update(id, {
      ...updateTaxProfileDto,
      ...(cerBase64 ? { cerBase64 } : {}),
      ...(keyBase64 ? { keyBase64 } : {})
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxProfilesService.remove(id);
  }
}
