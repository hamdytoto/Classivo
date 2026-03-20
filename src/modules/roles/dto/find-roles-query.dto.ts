import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationSortQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export const ROLE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'code',
  'name',
] as const;

export type RoleSortField = (typeof ROLE_SORT_FIELDS)[number];

export class FindRolesQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ROLE_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(ROLE_SORT_FIELDS)
  sortBy?: RoleSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
