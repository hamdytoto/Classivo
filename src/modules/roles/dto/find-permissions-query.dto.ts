import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationSortQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export const PERMISSION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'code',
  'name',
] as const;

export type PermissionSortField = (typeof PERMISSION_SORT_FIELDS)[number];

export class FindPermissionsQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PERMISSION_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(PERMISSION_SORT_FIELDS)
  sortBy?: PermissionSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
