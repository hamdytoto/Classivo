import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should allow legacy passwords that do not meet the strong-password policy', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'user@classivo.dev',
      password: 'weak',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an empty password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'user@classivo.dev',
      password: '',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('password');
  });
});
