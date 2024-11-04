import { Test, TestingModule } from '@nestjs/testing';
import { UserRest, UserService } from './user';

describe('UserRest', () => {
  let controller: UserRest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserRest],
      providers: [UserService],
    }).compile();

    controller = module.get<UserRest>(UserRest);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
