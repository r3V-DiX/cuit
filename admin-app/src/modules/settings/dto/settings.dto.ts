// admin-app/src/admin/dto/settings.dto.ts

import { IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
    @IsString() @MaxLength(2000)
    value: string;
}
