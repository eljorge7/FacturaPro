import { Module } from '@nestjs/common';
import { StockTakesService } from './stock-takes.service';
import { StockTakesController } from './stock-takes.controller';

@Module({
  providers: [StockTakesService],
  controllers: [StockTakesController]
})
export class StockTakesModule {}
