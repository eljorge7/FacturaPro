import { Test, TestingModule } from '@nestjs/testing';
import { StockTakesController } from './stock-takes.controller';

describe('StockTakesController', () => {
  let controller: StockTakesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockTakesController],
    }).compile();

    controller = module.get<StockTakesController>(StockTakesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
