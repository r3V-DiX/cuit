"use strict";
// libs/common/src/services/job-seeker-completion.service.ts
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
exports.JobSeekerCompletionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("@cykruit/prisma");
const JOB_SEEKER_WEIGHTS = {
    basicInfo: 15,
    profileImage: 5,
    professionalSummary: 10,
    experience: 15,
    education: 10,
    skills: 15,
    certifications: 10,
    projects: 10,
    ctfProfiles: 5,
    resume: 5,
    socialLinks: 0,
};
let JobSeekerCompletionService = class JobSeekerCompletionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateCompletion(profileOrId) {
        let profile;
        if (typeof profileOrId === 'string') {
            profile = await this.prisma.jobSeekerProfile.findUnique({
                where: { id: profileOrId },
                include: {
                    user: { select: { email: true, phone: true, profileImage: true } },
                    location: true,
                    experiences: true,
                    education: true,
                    skills: true,
                    certifications: true,
                    projects: true,
                    ctfProfiles: true,
                    resumes: true,
                },
            });
        }
        else {
            profile = profileOrId;
        }
        if (!profile)
            return this.getEmptyCompletion();
        const sections = {
            basicInfo: this.checkBasicInfo(profile),
            profileImage: this.checkProfileImage(profile),
            professionalSummary: this.checkProfessionalSummary(profile),
            experience: this.checkExperience(profile),
            education: this.checkEducation(profile),
            skills: this.checkSkills(profile),
            certifications: this.checkCertifications(profile),
            projects: this.checkProjects(profile),
            ctfProfiles: this.checkCtfProfiles(profile),
            resume: this.checkResume(profile),
            socialLinks: this.checkSocialLinks(profile),
        };
        let totalPercentage = 0;
        for (const [section, isComplete] of Object.entries(sections)) {
            if (isComplete)
                totalPercentage += JOB_SEEKER_WEIGHTS[section] || 0;
        }
        const missingSections = Object.entries(sections)
            .filter(([_, isComplete]) => !isComplete)
            .map(([section]) => this.formatSectionName(section));
        return {
            percentage: Math.round(totalPercentage),
            completedSections: sections,
            missingSections,
        };
    }
    checkBasicInfo(profile) {
        return !!(profile.firstName &&
            profile.lastName &&
            profile.title &&
            profile.location &&
            profile.user?.email);
    }
    checkProfileImage(profile) {
        return !!profile.user?.profileImage;
    }
    checkProfessionalSummary(profile) {
        return !!(profile.professionalSummary && profile.professionalSummary.length >= 50);
    }
    checkExperience(profile) {
        return !!(profile.experiences && profile.experiences.length > 0);
    }
    checkEducation(profile) {
        return !!(profile.education && profile.education.length > 0);
    }
    checkSkills(profile) {
        return !!(profile.skills && profile.skills.length >= 3);
    }
    checkCertifications(profile) {
        return !!(profile.certifications && profile.certifications.length > 0);
    }
    checkProjects(profile) {
        return !!(profile.projects && profile.projects.length > 0);
    }
    checkCtfProfiles(profile) {
        return !!(profile.ctfProfiles && profile.ctfProfiles.length > 0);
    }
    checkResume(profile) {
        return !!(profile.resumes && profile.resumes.length > 0);
    }
    checkSocialLinks(profile) {
        return !!(profile.linkedin || profile.github || profile.portfolio);
    }
    formatSectionName(section) {
        const nameMap = {
            basicInfo: 'Basic Information',
            profileImage: 'Profile Image',
            professionalSummary: 'Professional Summary',
            experience: 'Work Experience',
            education: 'Education',
            skills: 'Skills (at least 3)',
            certifications: 'Certifications',
            projects: 'Projects',
            ctfProfiles: 'CTF Profiles',
            resume: 'Resume',
            socialLinks: 'Social Links',
        };
        return nameMap[section] || section;
    }
    getEmptyCompletion() {
        return {
            percentage: 0,
            completedSections: {
                basicInfo: false,
                profileImage: false,
                professionalSummary: false,
                experience: false,
                education: false,
                skills: false,
                certifications: false,
                projects: false,
                ctfProfiles: false,
                resume: false,
                socialLinks: false,
            },
            missingSections: [
                'Basic Information', 'Profile Image', 'Professional Summary',
                'Work Experience', 'Education', 'Skills (at least 3)',
                'Certifications', 'Projects', 'CTF Profiles', 'Resume', 'Social Links',
            ],
        };
    }
};
exports.JobSeekerCompletionService = JobSeekerCompletionService;
exports.JobSeekerCompletionService = JobSeekerCompletionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], JobSeekerCompletionService);
