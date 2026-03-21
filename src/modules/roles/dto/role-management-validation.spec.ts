import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RolePermissionParamsDto } from './role-permission-params.dto';
import { UpdatePermissionDto } from './update-permission.dto';
import { UpdateRoleDto } from './update-role.dto';
import { UserRoleParamsDto } from './user-role-params.dto';

describe('Role-management DTO validation', () => {
  it('should reject an empty role update payload', async () => {
    const dto = plainToInstance(UpdateRoleDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('_atLeastOneField');
  });

  it('should reject an empty permission update payload', async () => {
    const dto = plainToInstance(UpdatePermissionDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('_atLeastOneField');
  });

  it('should require valid role and permission ids', async () => {
    const dto = plainToInstance(RolePermissionParamsDto, {
      roleId: 'invalid-role-id',
      permissionId: 'invalid-permission-id',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['roleId', 'permissionId']),
    );
  });

  it('should require valid user and role ids', async () => {
    const dto = plainToInstance(UserRoleParamsDto, {
      userId: 'invalid-user-id',
      roleId: 'invalid-role-id',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['userId', 'roleId']),
    );
  });
});
