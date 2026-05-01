import { Test, TestingModule } from '@nestjs/testing';
import { SatScraperService } from './sat-scraper.service';

describe('SatScraperService', () => {
  let service: SatScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SatScraperService],
    }).compile();

    service = module.get<SatScraperService>(SatScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
