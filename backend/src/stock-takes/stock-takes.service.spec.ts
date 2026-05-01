import { Test, TestingModule } from '@nestjs/testing';
import { StockTakesService } from './stock-takes.service';

describe('StockTakesService', () => {
  let service: StockTakesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTakesService],
    }).compile();

    service = module.get<StockTakesService>(StockTakesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
