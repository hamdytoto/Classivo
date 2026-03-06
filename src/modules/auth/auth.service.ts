import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getStatus(): string {
    return 'auth module is ready';
  }

  login(body: string): string {
    return `Login successful for user: ${body}`;
  }
}
