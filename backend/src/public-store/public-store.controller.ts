import { Controller, Get, Post, Body, Param, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { PublicStoreService } from './public-store.service';
import { JwtService } from '@nestjs/jwt';

@Controller('public-store/:slug')
export class PublicStoreController {
  constructor(
    private readonly storeService: PublicStoreService,
    private readonly jwtService: JwtService
  ) {}

  @Post('register')
  async register(@Param('slug') slug: string, @Body() data: any) {
    return this.storeService.registerCustomer(slug, data);
  }

  @Get('my-orders')
  async getMyOrders(@Param('slug') slug: string, @Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();
    return this.storeService.getMyOrders(slug, decoded.userId);
  }

  @Get('test-syscom')
  async testSyscom() {
    return this.storeService.testSyscom();
  }

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
