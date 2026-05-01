import { Test, TestingModule } from '@nestjs/testing';
import { XmlGeneratorService } from './xml-generator.service';

describe('XmlGeneratorService', () => {
  let service: XmlGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XmlGeneratorService],
    }).compile();

    service = module.get<XmlGeneratorService>(XmlGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
