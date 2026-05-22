import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PublicStoreService } from './public-store.service';

@Controller('public-store/:slug')
export class PublicStoreController {
  constructor(private readonly storeService: PublicStoreService) {}

  @Get('products')
  async getCatalog(@Param('slug') slug: string, @Query('search') search: string, @Query('page') page: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.storeService.getCombinedCatalog(slug, pageNum);
  }

  @Get('products/:id')
  async getProductDetails(@Param('slug') slug: string, @Param('id') id: string) {
    return this.storeService.getProductDetails(slug, id);
  }

  @Post('order')
  async createOrder(@Param('slug') slug: string, @Body() data: any) {
    return this.storeService.createOrder(slug, data);
  }

  @Post('order/:id/pay')
  async generatePaymentLink(@Param('slug') slug: string, @Param('id') id: string) {
    return this.storeService.generatePaymentLink(slug, id);
  }
}
