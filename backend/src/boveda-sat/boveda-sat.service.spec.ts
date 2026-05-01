import { Test, TestingModule } from '@nestjs/testing';
import { BovedaSatService } from './boveda-sat.service';

describe('BovedaSatService', () => {
  let service: BovedaSatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BovedaSatService],
    }).compile();

    service = module.get<BovedaSatService>(BovedaSatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
