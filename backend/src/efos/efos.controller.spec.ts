import { Test, TestingModule } from '@nestjs/testing';
import { EfosController } from './efos.controller';

describe('EfosController', () => {
  let controller: EfosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EfosController],
    }).compile();

    controller = module.get<EfosController>(EfosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
