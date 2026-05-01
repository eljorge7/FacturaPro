import { Test, TestingModule } from '@nestjs/testing';
import { PacService } from './pac.service';

describe('PacService', () => {
  let service: PacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PacService],
    }).compile();

    service = module.get<PacService>(PacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
