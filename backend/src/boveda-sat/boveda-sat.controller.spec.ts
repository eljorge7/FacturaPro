import { Test, TestingModule } from '@nestjs/testing';
import { BovedaSatController } from './boveda-sat.controller';

describe('BovedaSatController', () => {
  let controller: BovedaSatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BovedaSatController],
    }).compile();

    controller = module.get<BovedaSatController>(BovedaSatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
