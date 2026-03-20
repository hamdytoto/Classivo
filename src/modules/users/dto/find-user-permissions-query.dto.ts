import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationSortQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export const USER_PERMISSION_SORT_FIELDS = ['code', 'name'] as const;

export type UserPermissionSortField =
  (typeof USER_PERMISSION_SORT_FIELDS)[number];

export class FindUserPermissionsQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: USER_PERMISSION_SORT_FIELDS, default: 'code' })
  @IsOptional()
  @IsIn(USER_PERMISSION_SORT_FIELDS)
  sortBy?: UserPermissionSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.asc })
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
