import { Injectable } from '@nestjs/common';
import { FindUserService } from './find-user.service';

@Injectable()
export class GetCurrentUserProfileService {
  constructor(private readonly findUserService: FindUserService) {}

  execute(userId: string) {
    return this.findUserService.execute(userId);
  }
}
