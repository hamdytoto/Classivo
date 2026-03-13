import { Injectable } from '@nestjs/common';
import { compareHash, hash } from '../../../../common/security/hash.utils';

@Injectable()
export class PasswordHasherService {
  hash(value: string): Promise<string> {
    return hash(value);
  }

  compare(value: string, hashedValue: string): Promise<boolean> {
    return compareHash(value, hashedValue);
  }
}
