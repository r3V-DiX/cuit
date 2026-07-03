// apps/seeker-profile-service/src/profile/utils/validation.helpers.ts

import { BadRequestException } from '@nestjs/common';
import { DATE_REGEX } from './constants';

export class ValidationHelpers {
    static validateYearMonthFormat(date: string, fieldName = 'Date'): void {
        if (!DATE_REGEX.YEAR_MONTH.test(date))
            throw new BadRequestException(`${fieldName} must be in YYYY-MM format`);
    }

    static validateYearFormat(date: string, fieldName = 'Date'): void {
        if (!DATE_REGEX.YEAR.test(date))
            throw new BadRequestException(`${fieldName} must be in YYYY format`);
    }

    static validateYearMonthRange(startDate: string, endDate: string, startLabel = 'Start date', endLabel = 'End date'): void {
        this.validateYearMonthFormat(startDate, startLabel);
        this.validateYearMonthFormat(endDate, endLabel);
        if (endDate < startDate)
            throw new BadRequestException(`${endLabel} must be after ${startLabel}`);
    }

    static validateYearRange(startDate: string, endDate: string, startLabel = 'Start date', endLabel = 'End date'): void {
        this.validateYearFormat(startDate, startLabel);
        this.validateYearFormat(endDate, endLabel);
        if (parseInt(endDate) < parseInt(startDate))
            throw new BadRequestException(`${endLabel} must be after ${startLabel}`);
    }

    static validateCurrentDateLogic(current: boolean, endDate: string | null | undefined, entityType = 'job'): void {
        const normalizedEndDate = endDate === '' ? null : endDate;
        if (current && normalizedEndDate)
            throw new BadRequestException(`Current ${entityType} cannot have an end date`);
        if (!current && !normalizedEndDate)
            throw new BadRequestException(`End date is required for past ${entityType}s`);
    }

    static validateOptionalYearMonthRange(startDate?: string | null, endDate?: string | null): void {
        if (startDate && endDate) this.validateYearMonthRange(startDate, endDate);
    }

    static validateOptionalYearRange(startDate?: string | null, endDate?: string | null): void {
        if (startDate && endDate) this.validateYearRange(startDate, endDate);
    }

    static validateMutuallyExclusive(field1: any, field2: any, field1Name: string, field2Name: string): void {
        if (field1 && field2)
            throw new BadRequestException(`Cannot provide both ${field1Name} and ${field2Name}`);
    }

    static validateAtLeastOne(field1: any, field2: any, field1Name: string, field2Name: string): void {
        if (!field1 && !field2)
            throw new BadRequestException(`Must provide either ${field1Name} or ${field2Name}`);
    }
}