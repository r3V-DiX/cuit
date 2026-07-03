// apps/user-settings-service/src/settings/dto/seeker/location-preference.dto.ts

import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsInt,
    Min,
    ArrayNotEmpty,
    IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddLocationPreferenceDto {
    @IsString()
    @IsNotEmpty({ message: 'locationId is required' })
    @IsUUID('4', { message: 'locationId must be a valid UUID' })
    locationId: string;
}

export class ReorderLocationPreferencesDto {
    // Array of { id: locationPreferenceId, priority: 0|1|2|3|4 }
    // Frontend sends the full reordered list
    @IsArray()
    @ArrayNotEmpty({ message: 'locations array cannot be empty' })
    @Type(() => LocationPriorityItem)
    locations: LocationPriorityItem[];
}

export class LocationPriorityItem {
    @IsString()
    @IsNotEmpty()
    @IsUUID('4', { message: 'id must be a valid UUID' })
    id: string;

    @IsInt()
    @Min(0)
    priority: number;
}