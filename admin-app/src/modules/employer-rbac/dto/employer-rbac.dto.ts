// admin-app/src/modules/employer-rbac/dto/employer-rbac.dto.ts

import { IsArray, IsUUID } from 'class-validator';

export class SetRoleGrantsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    permissionIds: string[];
}
