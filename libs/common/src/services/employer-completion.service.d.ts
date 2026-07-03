import { PrismaService } from '@cykruit/prisma';
export interface EmployerCompletionResult {
    percentage: number;
    completedSections: Record<string, boolean>;
    missingSections: string[];
}
export declare class EmployerCompletionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    calculateCompletion(employerOrId: string | any): Promise<EmployerCompletionResult>;
    canPostJobs(employerId: string): Promise<boolean>;
    canSubmitVerification(employerId: string): Promise<boolean>;
    private checkBasicInfo;
    private checkBranding;
    private checkAbout;
    private checkContact;
    private checkSocial;
    private checkVerification;
    private checkTagline;
    private checkCulture;
    private checkInstagram;
    private checkOfficeLocations;
    private checkBenefits;
    private checkTeamMembers;
    private checkCompanyMedia;
    private formatSectionName;
    private getEmptyCompletion;
}
