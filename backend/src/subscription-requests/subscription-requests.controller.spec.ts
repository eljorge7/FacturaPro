import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRequestsController } from './subscription-requests.controller';

describe('SubscriptionRequestsController', () => {
  let controller: SubscriptionRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionRequestsController],
    }).compile();

    controller = module.get<SubscriptionRequestsController>(SubscriptionRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
