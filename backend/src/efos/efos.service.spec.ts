import { Test, TestingModule } from '@nestjs/testing';
import { EfosService } from './efos.service';

describe('EfosService', () => {
  let service: EfosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EfosService],
    }).compile();

    service = module.get<EfosService>(EfosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
