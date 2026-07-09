// apps/employer-service/src/employer/dto/company.dto.ts

import {
    IsString,
    IsOptional,
    IsEnum,
    IsUrl,
    IsEmail,
    IsBoolean,
    IsInt,
    Min,
    Max,
    MaxLength,
    MinLength,
    IsIn,
} from 'class-validator';
import { CompanyType, Industry, CompanySize } from '@prisma/client';

export class CreateCompanyDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    companyName: string;

    @IsEnum(CompanyType)
    companyType: CompanyType;

    @IsEnum(Industry)
    industry: Industry;

    @IsEnum(CompanySize)
    companySize: CompanySize;

    @IsString()
    @MaxLength(200)
    location: string;

    @IsOptional()
    @IsUrl()
    companyWebsite?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;
}

export class UpdateCompanyBasicDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    companyName?: string;

    @IsOptional()
    @IsEnum(CompanyType)
    companyType?: CompanyType;

    @IsOptional()
    @IsEnum(Industry)
    industry?: Industry;

    @IsOptional()
    @IsEnum(CompanySize)
    companySize?: CompanySize;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    location?: string;

    @IsOptional()
    @IsUrl()
    companyWebsite?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsInt()
    @Min(1800)
    @Max(new Date().getFullYear())
    foundedYear?: number;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    tagline?: string;
}

export class UpdateCompanyAboutDto {
    @IsOptional()
    @IsString()
    @MaxLength(3000)
    about?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    mission?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    vision?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    cultureDescription?: string;
}

export class UpdateCompanySocialDto {
    @IsOptional()
    @IsUrl()
    linkedin?: string;

    @IsOptional()
    @IsString()
    twitter?: string;

    @IsOptional()
    @IsString()
    facebook?: string;

    @IsOptional()
    @IsString()
    instagram?: string;
}

export class AddOfficeLocationDto {
    @IsString()
    @IsIn(['Headquarters', 'Office', 'Branch'])
    type: string;

    @IsString()
    @MaxLength(500)
    address: string;

    @IsString()
    @MaxLength(100)
    city: string;

    @IsString()
    @MaxLength(100)
    state: string;

    @IsString()
    @MaxLength(100)
    country: string;

    @IsBoolean()
    isHeadquarters: boolean;
}

export class AddCompanyBenefitDto {
    @IsString()
    @MaxLength(100)
    title: string;

    @IsString()
    @MaxLength(500)
    description: string;

    @IsOptional()
    @IsString()
    icon?: string;
}
