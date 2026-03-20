import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationSortQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export const USER_ROLE_SORT_FIELDS = ['assignedAt', 'code', 'name'] as const;

export type UserRoleSortField = (typeof USER_ROLE_SORT_FIELDS)[number];

export class FindUserRolesQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: USER_ROLE_SORT_FIELDS, default: 'assignedAt' })
  @IsOptional()
  @IsIn(USER_ROLE_SORT_FIELDS)
  sortBy?: UserRoleSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
