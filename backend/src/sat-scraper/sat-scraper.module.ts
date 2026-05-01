import { Module } from '@nestjs/common';
import { SatScraperService } from './sat-scraper.service';

@Module({
  providers: [SatScraperService]
})
export class SatScraperModule {}
