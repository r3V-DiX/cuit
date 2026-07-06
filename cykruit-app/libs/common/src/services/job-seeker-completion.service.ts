// libs/common/src/services/job-seeker-completion.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";

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

const JOB_SEEKER_WEIGHTS: Record<string, number> = {
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

@Injectable()
export class JobSeekerCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCompletion(
    profileOrId: string | any,
  ): Promise<JobSeekerCompletionResult> {
    let profile: any;

    if (typeof profileOrId === "string") {
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
    } else {
      profile = profileOrId;
    }

    if (!profile) return this.getEmptyCompletion();

    const sections: JobSeekerCompletionSections = {
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
      if (isComplete) totalPercentage += JOB_SEEKER_WEIGHTS[section] || 0;
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

  private checkBasicInfo(profile: any): boolean {
    return !!(
      profile.firstName &&
      profile.lastName &&
      profile.title &&
      profile.location &&
      profile.user?.email
    );
  }

  private checkProfileImage(profile: any): boolean {
    return !!profile.user?.profileImage;
  }

  private checkProfessionalSummary(profile: any): boolean {
    return !!(
      profile.professionalSummary && profile.professionalSummary.length >= 50
    );
  }

  private checkExperience(profile: any): boolean {
    return !!(profile.experiences && profile.experiences.length > 0);
  }

  private checkEducation(profile: any): boolean {
    return !!(profile.education && profile.education.length > 0);
  }

  private checkSkills(profile: any): boolean {
    return !!(profile.skills && profile.skills.length >= 3);
  }

  private checkCertifications(profile: any): boolean {
    return !!(profile.certifications && profile.certifications.length > 0);
  }

  private checkProjects(profile: any): boolean {
    return !!(profile.projects && profile.projects.length > 0);
  }

  private checkCtfProfiles(profile: any): boolean {
    return !!(profile.ctfProfiles && profile.ctfProfiles.length > 0);
  }

  private checkResume(profile: any): boolean {
    return !!(profile.resumes && profile.resumes.length > 0);
  }

  private checkSocialLinks(profile: any): boolean {
    return !!(profile.linkedin || profile.github || profile.portfolio);
  }

  private formatSectionName(section: string): string {
    const nameMap: Record<string, string> = {
      basicInfo: "Basic Information",
      profileImage: "Profile Image",
      professionalSummary: "Professional Summary",
      experience: "Work Experience",
      education: "Education",
      skills: "Skills (at least 3)",
      certifications: "Certifications",
      projects: "Projects",
      ctfProfiles: "CTF Profiles",
      resume: "Resume",
      socialLinks: "Social Links",
    };
    return nameMap[section] || section;
  }

  private getEmptyCompletion(): JobSeekerCompletionResult {
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
        "Basic Information",
        "Profile Image",
        "Professional Summary",
        "Work Experience",
        "Education",
        "Skills (at least 3)",
        "Certifications",
        "Projects",
        "CTF Profiles",
        "Resume",
        "Social Links",
      ],
    };
  }
}
