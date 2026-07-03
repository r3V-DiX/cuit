// libs/common/src/services/employer-completion.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';

export interface EmployerCompletionResult {
    percentage: number;
    completedSections: Record<string, boolean>;
    missingSections: string[];
}

const EMPLOYER_WEIGHTS: Record<string, number> = {
    // Core sections — total 100%
    basicInfo: 20,
    branding: 15,
    about: 15,
    contact: 10,
    social: 10,
    verification: 30,
    // Bonus sections — can push over 100, capped at 100
    tagline: 2,
    culture: 3,
    instagram: 1,
    officeLocations: 2,
    benefits: 3,
    teamMembers: 2,
    companyMedia: 2,
};

@Injectable()
export class EmployerCompletionService {
    constructor(private readonly prisma: PrismaService) { }

    async calculateCompletion(employerOrId: string | any): Promise<EmployerCompletionResult> {
        let employer: any;

        if (typeof employerOrId === 'string') {
            employer = await this.prisma.employer.findUnique({
                where: { id: employerOrId },
                include: {
                    officeLocations: true,
                    benefits: true,
                    teamMembers: true,
                    companyMedia: true,
                },
            });
        } else {
            employer = employerOrId;
        }

        if (!employer) return this.getEmptyCompletion();

        const sections = {
            basicInfo: this.checkBasicInfo(employer),
            branding: this.checkBranding(employer),
            about: this.checkAbout(employer),
            contact: this.checkContact(employer),
            social: this.checkSocial(employer),
            verification: this.checkVerification(employer),
            tagline: this.checkTagline(employer),
            culture: this.checkCulture(employer),
            instagram: this.checkInstagram(employer),
            officeLocations: this.checkOfficeLocations(employer),
            benefits: this.checkBenefits(employer),
            teamMembers: this.checkTeamMembers(employer),
            companyMedia: this.checkCompanyMedia(employer),
        };

        let totalPercentage = 0;
        for (const [section, isComplete] of Object.entries(sections)) {
            if (isComplete) totalPercentage += EMPLOYER_WEIGHTS[section] || 0;
        }

        const coreSections = ['basicInfo', 'branding', 'about', 'contact', 'social', 'verification'];
        const missingSections = Object.entries(sections)
            .filter(([section, isComplete]) => !isComplete && coreSections.includes(section))
            .map(([section]) => this.formatSectionName(section));

        return {
            percentage: Math.min(100, Math.round(totalPercentage)),
            completedSections: sections,
            missingSections,
        };
    }

    async canPostJobs(employerId: string): Promise<boolean> {
        const completion = await this.calculateCompletion(employerId);
        return completion.percentage >= 80;
    }

    async canSubmitVerification(employerId: string): Promise<boolean> {
        const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
        if (!employer) return false;
        return this.checkBasicInfo(employer);
    }

    private checkBasicInfo(e: any): boolean {
        return !!(e.companyName && e.companyWebsite && e.companyType && e.industry && e.companySize && e.location);
    }
    private checkBranding(e: any): boolean { return !!(e.companyLogo && e.companyBanner); }
    private checkAbout(e: any): boolean { return !!(e.about && e.about.length >= 50 && (e.mission || e.vision)); }
    private checkContact(e: any): boolean { return !!e.contactEmail; }
    private checkSocial(e: any): boolean { return !!(e.linkedin || e.twitter); }
    private checkVerification(e: any): boolean { return e.isVerified === true; }
    private checkTagline(e: any): boolean { return !!(e.tagline && e.tagline.length >= 10); }
    private checkCulture(e: any): boolean { return !!(e.cultureDescription && e.cultureDescription.length >= 50); }
    private checkInstagram(e: any): boolean { return !!e.instagram; }
    private checkOfficeLocations(e: any): boolean { return !!(e.officeLocations && e.officeLocations.length > 0); }
    private checkBenefits(e: any): boolean { return !!(e.benefits && e.benefits.length >= 3); }
    private checkTeamMembers(e: any): boolean { return !!(e.teamMembers && e.teamMembers.length > 0); }
    private checkCompanyMedia(e: any): boolean { return !!(e.companyMedia && e.companyMedia.length >= 3); }

    private formatSectionName(section: string): string {
        const nameMap: Record<string, string> = {
            basicInfo: 'Company Information',
            branding: 'Company Logo & Banner',
            about: 'About Company (with Mission/Vision)',
            contact: 'Contact Email',
            social: 'Social Links (LinkedIn or Twitter)',
            verification: 'Company Verification',
            tagline: 'Company Tagline',
            culture: 'Company Culture Description',
            instagram: 'Instagram Profile',
            officeLocations: 'Office Locations',
            benefits: 'Company Benefits (at least 3)',
            teamMembers: 'Team Members',
            companyMedia: 'Company Media Gallery (at least 3)',
        };
        return nameMap[section] || section;
    }

    private getEmptyCompletion(): EmployerCompletionResult {
        return {
            percentage: 0,
            completedSections: {
                basicInfo: false, branding: false, about: false, contact: false,
                social: false, verification: false, tagline: false, culture: false,
                instagram: false, officeLocations: false, benefits: false,
                teamMembers: false, companyMedia: false,
            },
            missingSections: [
                'Company Information', 'Company Logo & Banner',
                'About Company (with Mission/Vision)', 'Contact Email',
                'Social Links (LinkedIn or Twitter)', 'Company Verification',
            ],
        };
    }
}