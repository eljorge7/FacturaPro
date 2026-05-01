import { Controller, Post, UseGuards } from '@nestjs/common';
import { EfosService } from './efos.service';

@Controller('efos')
export class EfosController {
  constructor(private readonly efosService: EfosService) {}

  @Post('sync')
  async syncEfos() {
      return await this.efosService.syncEfosList();
  }
}
