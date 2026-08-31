// admin-app/src/modules/emails/dto/emails.dto.ts

import {
    IsArray,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailCampaignStatus, EmailRecipientType } from '@prisma/client';

export class SendEmailCampaignDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    subject!: string;

    @IsString()
    @IsNotEmpty()
    bodyHtml!: string;

    @IsEnum(EmailRecipientType)
    recipientType!: EmailRecipientType;

    @IsOptional()
    @IsString()
    segmentTarget?: string; // "ALL" | "SEEKERS" | "EMPLOYERS" | "ACTIVE"

    @IsOptional()
    @IsArray()
    @IsEmail({}, { each: true })
    customEmails?: string[];
}

export class TestEmailDto {
    @IsEmail()
    @IsNotEmpty()
    toEmail!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    subject!: string;

    @IsString()
    @IsNotEmpty()
    bodyHtml!: string;

    @IsOptional()
    @IsObject()
    sampleVariables?: Record<string, string>;
}

export class PreviewEmailDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    subject!: string;

    @IsString()
    @IsNotEmpty()
    bodyHtml!: string;

    @IsOptional()
    @IsObject()
    sampleVariables?: Record<string, string>;
}

export class CampaignListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @IsOptional()
    @IsEnum(EmailCampaignStatus)
    status?: EmailCampaignStatus;

    @IsOptional()
    @IsString()
    search?: string;
}
