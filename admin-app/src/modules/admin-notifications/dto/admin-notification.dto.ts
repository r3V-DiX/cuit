// admin-app/src/modules/admin-notifications/dto/admin-notification.dto.ts

import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAdminNotificationsDto {
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    unreadOnly?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
