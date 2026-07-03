"use strict";
// libs/common/src/services/employer-completion.service.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerCompletionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("@cykruit/prisma");
const EMPLOYER_WEIGHTS = {
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
let EmployerCompletionService = class EmployerCompletionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateCompletion(employerOrId) {
        let employer;
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
        }
        else {
            employer = employerOrId;
        }
        if (!employer)
            return this.getEmptyCompletion();
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
            if (isComplete)
                totalPercentage += EMPLOYER_WEIGHTS[section] || 0;
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
    async canPostJobs(employerId) {
        const completion = await this.calculateCompletion(employerId);
        return completion.percentage >= 80;
    }
    async canSubmitVerification(employerId) {
        const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
        if (!employer)
            return false;
        return this.checkBasicInfo(employer);
    }
    checkBasicInfo(e) {
        return !!(e.companyName && e.companyWebsite && e.companyType && e.industry && e.companySize && e.location);
    }
    checkBranding(e) { return !!(e.companyLogo && e.companyBanner); }
    checkAbout(e) { return !!(e.about && e.about.length >= 50 && (e.mission || e.vision)); }
    checkContact(e) { return !!e.contactEmail; }
    checkSocial(e) { return !!(e.linkedin || e.twitter); }
    checkVerification(e) { return e.isVerified === true; }
    checkTagline(e) { return !!(e.tagline && e.tagline.length >= 10); }
    checkCulture(e) { return !!(e.cultureDescription && e.cultureDescription.length >= 50); }
    checkInstagram(e) { return !!e.instagram; }
    checkOfficeLocations(e) { return !!(e.officeLocations && e.officeLocations.length > 0); }
    checkBenefits(e) { return !!(e.benefits && e.benefits.length >= 3); }
    checkTeamMembers(e) { return !!(e.teamMembers && e.teamMembers.length > 0); }
    checkCompanyMedia(e) { return !!(e.companyMedia && e.companyMedia.length >= 3); }
    formatSectionName(section) {
        const nameMap = {
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
    getEmptyCompletion() {
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
};
exports.EmployerCompletionService = EmployerCompletionService;
exports.EmployerCompletionService = EmployerCompletionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], EmployerCompletionService);
