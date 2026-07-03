import { PrismaService } from '@cykruit/prisma';
export interface JobSeekerCompletionSections {
    basicInfo: boolean;
    profileImage: boolean;
    professionalSummary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    certifications: boolean;
    projects: boolean;
    ctfProfiles: boolean;
    resume: boolean;
    socialLinks: boolean;
}
export interface JobSeekerCompletionResult {
    percentage: number;
    completedSections: JobSeekerCompletionSections;
    missingSections: string[];
}
export declare class JobSeekerCompletionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    calculateCompletion(profileOrId: string | any): Promise<JobSeekerCompletionResult>;
    private checkBasicInfo;
    private checkProfileImage;
    private checkProfessionalSummary;
    private checkExperience;
    private checkEducation;
    private checkSkills;
    private checkCertifications;
    private checkProjects;
    private checkCtfProfiles;
    private checkResume;
    private checkSocialLinks;
    private formatSectionName;
    private getEmptyCompletion;
}
