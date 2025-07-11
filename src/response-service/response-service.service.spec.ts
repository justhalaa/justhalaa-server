import { Test, TestingModule } from '@nestjs/testing';
import { ResponseServiceService } from './response-service.service';

describe('ResponseServiceService', () => {
  let service: ResponseServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseServiceService],
    }).compile();

    service = module.get<ResponseServiceService>(ResponseServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
