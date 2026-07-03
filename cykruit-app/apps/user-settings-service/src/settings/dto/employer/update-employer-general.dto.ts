// apps/user-settings-service/src/settings/dto/employer/update-employer-general.dto.ts

import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { EmployerProfileVisibility } from '@prisma/client';

export class UpdateEmployerGeneralDto {
    @IsOptional()
    @IsEnum(EmployerProfileVisibility, {
        message: `profileVisibility must be one of: ${Object.values(EmployerProfileVisibility).join(', ')}`,
    })
    profileVisibility?: EmployerProfileVisibility;

    @IsOptional()
    @IsBoolean({ message: 'showCompanyDetailsBeforeApply must be a boolean' })
    showCompanyDetailsBeforeApply?: boolean;
}