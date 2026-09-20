import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  get offset() {
    return (this.page - 1) * this.pageSize;
  }
  get limit() {
    return this.pageSize;
  }
}

export function paginated<T>(data: T[], total: number, dto: PaginationDto, message?: string) {
  return {
    success: true as const,
    data,
    meta: {
      page: dto.page,
      pageSize: dto.pageSize,
      total,
      totalPages: Math.ceil(total / dto.pageSize),
    },
    message,
  };
}
