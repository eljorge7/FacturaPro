import { Controller, Get, Query } from '@nestjs/common';
import { SatCatalogsService } from './sat-catalogs.service';

@Controller('sat-catalogs')
export class SatCatalogsController {
  constructor(private readonly satCatalogsService: SatCatalogsService) {}

  @Get('products')
  searchProducts(@Query('q') q: string) {
    return this.satCatalogsService.searchProducts(q || '');
  }
}
