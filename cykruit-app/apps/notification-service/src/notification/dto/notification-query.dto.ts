// apps/notification-service/src/notification/dto/notification-query.dto.ts

import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class NotificationListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 20;

    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    /** true = only unread, false = only read, omit = all */
    @IsOptional()
    unreadOnly?: boolean;
}
