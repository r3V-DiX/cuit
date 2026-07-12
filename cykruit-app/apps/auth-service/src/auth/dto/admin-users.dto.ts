// apps/auth-service/src/auth/dto/admin-users.dto.ts

import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search by email, firstName, or lastName' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['SEEKER', 'EMPLOYER', 'ADMIN'] })
  @IsOptional()
  @IsIn(['SEEKER', 'EMPLOYER', 'ADMIN'])
  role?: 'SEEKER' | 'EMPLOYER' | 'ADMIN';

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'PENDING', 'PENDING_DELETION', 'INACTIVE', 'DELETED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'PENDING', 'PENDING_DELETION', 'INACTIVE', 'DELETED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'PENDING_DELETION' | 'INACTIVE' | 'DELETED';
}
