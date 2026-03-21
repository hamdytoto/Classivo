import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationSortQueryDto,
  SortOrder,
} from '../../../../common/dto/pagination-query.dto';

export const SESSION_SORT_FIELDS = [
  'createdAt',
  'lastUsedAt',
  'updatedAt',
  'expiresAt',
] as const;

export type SessionSortField = (typeof SESSION_SORT_FIELDS)[number];

export class ListActiveSessionsQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ enum: SESSION_SORT_FIELDS, default: 'lastUsedAt' })
  @IsOptional()
  @IsIn(SESSION_SORT_FIELDS)
  sortBy?: SessionSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
