
import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Req, Query, UnauthorizedException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.productsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/products',
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return {
      imageUrl: `/uploads/products/${file.filename}`,
    };
  }

  @Get(':id/movements')
  getMovements(@Param('id') id: string) {
    return this.productsService.getMovements(id);
  }

  @Post(':id/movements')
  async addMovement(@Req() req: any, @Param('id') id: string, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.productsService.addMovement(tenantId, id, payload);
  }

  @Get(':id/serials')
  async getSerials(@Req() req: any, @Param('id') id: string, @Query('status') status?: string) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.productsService.getSerials(tenantId, id, status);
  }
}
