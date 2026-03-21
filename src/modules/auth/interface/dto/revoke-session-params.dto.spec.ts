import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RevokeSessionParamsDto } from './revoke-session-params.dto';

describe('RevokeSessionParamsDto', () => {
  it('should require a valid session id', async () => {
    const dto = plainToInstance(RevokeSessionParamsDto, {
      sessionId: 'invalid-session-id',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('sessionId');
  });
});
