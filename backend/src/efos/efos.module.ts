import { Module } from '@nestjs/common';
import { EfosController } from './efos.controller';
import { EfosService } from './efos.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EfosController],
  providers: [EfosService]
})
export class EfosModule {}
