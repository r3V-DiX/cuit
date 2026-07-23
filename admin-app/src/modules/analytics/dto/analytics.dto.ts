// admin-app/src/modules/analytics/dto/analytics.dto.ts

import { IsIn, IsOptional } from 'class-validator';

export const PERIODS = ['7d', '30d', '90d'] as const;
export type Period = (typeof PERIODS)[number];

export class AnalyticsQueryDto {
    @IsOptional() @IsIn(PERIODS)
    period?: Period = '30d';
}
