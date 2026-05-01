import { Module } from '@nestjs/common';
import { BovedaSatController } from './boveda-sat.controller';
import { BovedaSatService } from './boveda-sat.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BovedaSatController],
  providers: [BovedaSatService]
})
export class BovedaSatModule {}
