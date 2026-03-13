import { Injectable } from '@nestjs/common';
import { hashToken } from '../../../../common/security/jwt.utils';

@Injectable()
export class TokenHasherService {
  hash(value: string): string {
    return hashToken(value);
  }
}
