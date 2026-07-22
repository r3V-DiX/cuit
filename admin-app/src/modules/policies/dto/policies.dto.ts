// admin-app/src/modules/policies/dto/policies.dto.ts

import { IsString, MaxLength } from 'class-validator';

export class UpdatePolicyDto {
    @IsString() @MaxLength(2000)
    value: string;
}
