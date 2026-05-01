import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Controller('api-keys')
export class ApiKeysController {
  constructor(
     private readonly apiKeysService: ApiKeysService,
     private readonly jwtService: JwtService
  ) {}

  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeysService.create(createApiKeyDto);
  }

  @Get('mine')
  async findMine(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException('Token requerido');
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.tenantId) throw new UnauthorizedException('Token inválido');
    return this.apiKeysService.findMine(decoded.tenantId);
  }

  @Post('generate')
  async generateNewKey(@Headers('Authorization') auth: string, @Body() body: { name: string }) {
    if (!auth) throw new UnauthorizedException('Token requerido');
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.tenantId) throw new UnauthorizedException('Token inválido');
    return this.apiKeysService.generateNewKey(decoded.tenantId, body.name);
  }

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeysService.update(id, updateApiKeyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }
}
