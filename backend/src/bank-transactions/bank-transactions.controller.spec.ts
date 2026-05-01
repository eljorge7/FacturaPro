import { Test, TestingModule } from '@nestjs/testing';
import { BankTransactionsController } from './bank-transactions.controller';

describe('BankTransactionsController', () => {
  let controller: BankTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTransactionsController],
    }).compile();

    controller = module.get<BankTransactionsController>(BankTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
