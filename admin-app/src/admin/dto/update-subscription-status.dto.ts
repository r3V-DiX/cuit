// admin-app/src/admin/dto/update-subscription-status.dto.ts

import { IsIn } from 'class-validator';

export class UpdateSubscriptionStatusDto {
    @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'], {
        message: 'status must be one of: ACTIVE, EXPIRED, CANCELLED',
    })
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}
