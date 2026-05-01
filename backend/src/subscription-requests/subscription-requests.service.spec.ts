import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRequestsService } from './subscription-requests.service';

describe('SubscriptionRequestsService', () => {
  let service: SubscriptionRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionRequestsService],
    }).compile();

    service = module.get<SubscriptionRequestsService>(SubscriptionRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
