import { UserStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  PaginationSortQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export const ROLE_USER_SORT_FIELDS = [
  'assignedAt',
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'email',
] as const;

export type RoleUserSortField = (typeof ROLE_USER_SORT_FIELDS)[number];

export class FindRoleUsersQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: ROLE_USER_SORT_FIELDS, default: 'assignedAt' })
  @IsOptional()
  @IsIn(ROLE_USER_SORT_FIELDS)
  sortBy?: RoleUserSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
