import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UuidParamDto } from './uuid-param.dto';

describe('UuidParamDto', () => {
  it('should require a valid uuid value', async () => {
    const dto = plainToInstance(UuidParamDto, {
      id: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('id');
  });

  it('should accept a valid uuid value', async () => {
    const dto = plainToInstance(UuidParamDto, {
      id: '80b88712-65d6-4a78-bcf5-f59661a3943f',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
