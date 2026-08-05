// admin-app/src/admin/dto/update-subscription-status.dto.ts

import { IsIn, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSubscriptionStatusDto {
    @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'], {
        message: 'status must be one of: ACTIVE, EXPIRED, CANCELLED',
    })
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

    /**
     * Optional: polite "cancel at period end" — keeps status ACTIVE + sets the flag so
     * paid access continues until expiry. Requires status ACTIVE (validated in service).
     * Omit for the authoritative hard overrides (CANCELLED = hard cancel, EXPIRED = expire,
     * ACTIVE = resume/reactivate).
     */
    @IsOptional()
    @IsBoolean()
    cancelAtPeriodEnd?: boolean;
}
