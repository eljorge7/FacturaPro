import { Module } from '@nestjs/common';
import { TaxProfilesService } from './tax-profiles.service';
import { TaxProfilesController } from './tax-profiles.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [TaxProfilesController],
  providers: [TaxProfilesService, JwtService],
})
export class TaxProfilesModule {}
