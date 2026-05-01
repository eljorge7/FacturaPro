import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BovedaSatService } from './boveda-sat.service';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';

@UseGuards(HybridAuthGuard)
@Controller('boveda-sat')
export class BovedaSatController {
  constructor(private readonly bovedaSatService: BovedaSatService) {}

  @Get()
  getRequests(@Request() req: any) {
      const tenantId = req.tenantId || req.query.tenantId;
      return this.bovedaSatService.getRequests(tenantId);
  }

  @Post('request')
  requestDownload(
      @Request() req: any,
      @Body() body: any
  ) {
      const tenantId = req.tenantId || body['tenantId'];
      return this.bovedaSatService.requestDownload(tenantId, { start: body.start, end: body.end }, body.type);
  }

  @Get('verify/:idSolicitud')
  verifyDownload(
      @Request() req: any,
      @Param('idSolicitud') idSolicitud: string
  ) {
      const tenantId = req.tenantId || req.query.tenantId;
      return this.bovedaSatService.verifyDownload(tenantId, idSolicitud);
  }

  @Post('download/:idPaquete')
  downloadPackage(
      @Request() req: any,
      @Param('idPaquete') idPaquete: string
  ) {
      const tenantId = req.tenantId || req.body.tenantId;
      return this.bovedaSatService.downloadAndProcessPackage(tenantId, idPaquete);
  }
}
