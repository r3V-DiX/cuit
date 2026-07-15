// apps/seeker-profile-service/src/profile/services/ai-profile.service.ts
import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AIService } from "@cykruit/ai";
import { ProfileService } from "./profile.service";
import { ExperienceService } from "./experience.service";
import { EducationService } from "./education.service";
import { SkillsService } from "./skills.service";
import { CertificationsService } from "./certifications.service";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { AI_QUEUES, AI_JOB_NAMES } from "@cykruit/ai";
import { UpdateBasicInfoDto } from "../dto/update-basic-info.dto";
import { SkillProficiency } from "../dto/skills/add-skill.dto";
import { PrismaService } from "@cykruit/prisma";

export interface ParsedExp { title?: string; company?: string; location?: string; startDate?: string; endDate?: string; isCurrent?: boolean; description?: string; }
export interface ParsedEdu { degree?: string; school?: string; startDate?: string; endDate?: string; }
export interface ParsedCert { name?: string; issuer?: string; issueDate?: string; }
export interface ParsedResume {
  firstName?: string; lastName?: string; email?: string; title?: string;
  location?: string; linkedin?: string; github?: string; portfolio?: string;
  summary?: string;
  experiences?: ParsedExp[];
  education?: ParsedEdu[];
  skills?: string[];
  certifications?: ParsedCert[];
}

@Injectable()
export class AIProfileService {
  private readonly logger = new Logger(AIProfileService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
    private readonly profileService: ProfileService,
    private readonly experienceService: ExperienceService,
    private readonly educationService: EducationService,
    private readonly skillsService: SkillsService,
    private readonly certsService: CertificationsService,
    private readonly prisma: PrismaService,
    @InjectQueue(AI_QUEUES.AI_JOBS) private readonly aiQueue: Queue,
  ) {}

  async parseResumeAndApply(userId: string, pdfBuffer: Buffer) {
    this.logger.log(`Extracting text from PDF for user ${userId}`);
    const text = await this.aiService.extractTextFromPDF(pdfBuffer);
    
    this.logger.log(`Parsing extracted text via ai-service`);
    const aiUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
    const res = await fetch(`${aiUrl}/ai/resume/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.substring(0, 30000) })
    });

    if (!res.ok) {
      throw new InternalServerErrorException(`Failed to parse resume: ${res.statusText}`);
    }
    const parsedData = (await res.json()) as ParsedResume;

    this.logger.log(`Applying parsed data to DB`);
    
    // Get the profile ID to clear existing data
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (profile) {
      this.logger.log(`Clearing existing profile arrays for override`);
      await this.prisma.$transaction([
        this.prisma.experience.deleteMany({ where: { profileId: profile.id } }),
        this.prisma.education.deleteMany({ where: { profileId: profile.id } }),
        this.prisma.jobSeekerSkill.deleteMany({ where: { profileId: profile.id } }),
        this.prisma.jobSeekerCertification.deleteMany({ where: { profileId: profile.id } }),
      ]);
    }

    // 1. Basic Info & Summary
    const basicInfo: Partial<UpdateBasicInfoDto> = {};
    if (parsedData.firstName) basicInfo.firstName = parsedData.firstName as string;
    if (parsedData.lastName) basicInfo.lastName = parsedData.lastName as string;
    if (parsedData.email) basicInfo.professionalEmail = parsedData.email as string;
    if (parsedData.title) basicInfo.title = parsedData.title as string;
    if (parsedData.location) {
      const parts = (parsedData.location as string).split(',').map((p: string) => p.trim());
      if (parts.length >= 2) {
        basicInfo.location = { city: parts[0], state: parts.length > 2 ? parts[1] : undefined, country: parts[parts.length - 1] };
      } else {
        basicInfo.location = { city: parts[0], country: "Unknown" };
      }
    }
    if (parsedData.linkedin) basicInfo.linkedin = parsedData.linkedin as string;
    if (parsedData.github) basicInfo.github = parsedData.github as string;
    if (parsedData.portfolio) basicInfo.portfolio = parsedData.portfolio as string;

    if (Object.keys(basicInfo).length > 0) {
      await this.profileService.updateBasicInfo(userId, basicInfo).catch(e => this.logger.warn("Failed basic info update", e.message));
    }
    if (parsedData.summary) {
      await this.profileService.updateSummary(userId, { summary: parsedData.summary as string }).catch(e => this.logger.warn("Failed summary update", e.message));
    }

    // 2. Experiences
    const parsedExperiences = parsedData.experiences as ParsedExp[] | undefined;
    if (parsedExperiences && parsedExperiences.length > 0) {
      for (const exp of parsedExperiences) {
        if (!exp.title || !exp.company) continue;
        const validStartDate = exp.startDate?.match(/^\d{4}-(0[1-9]|1[0-2])$/) ? exp.startDate : "2020-01";
        const validEndDate = exp.endDate?.match(/^\d{4}-(0[1-9]|1[0-2])$/) ? exp.endDate : undefined;
        await this.experienceService.createExperience(userId, {
          title: exp.title.substring(0, 100),
          company: exp.company.substring(0, 100),
          location: exp.location?.substring(0, 200) || "Remote",
          startDate: validStartDate,
          endDate: validEndDate,
          current: exp.isCurrent,
          description: (exp.description || "Parsed from resume.").substring(0, 2000),
          tools: ["General"],
        }).catch(e => this.logger.warn("Failed saving experience", e.message));
      }
    }

    // 3. Education
    const parsedEducation = parsedData.education as ParsedEdu[] | undefined;
    if (parsedEducation && parsedEducation.length > 0) {
      for (const edu of parsedEducation) {
        if (!edu.degree || !edu.school) continue;
        const validStart = edu.startDate?.match(/^\d{4}$/) ? edu.startDate : undefined;
        const validEnd = edu.endDate?.match(/^\d{4}$/) ? edu.endDate : undefined;
        await this.educationService.createEducation(userId, {
          degree: edu.degree.substring(0, 200),
          instituteName: edu.school.substring(0, 200),
          startDate: validStart,
          endDate: validEnd,
        }).catch(e => this.logger.warn("Failed saving education", e.message));
      }
    }

    // 4. Skills
    const parsedSkills = parsedData.skills as string[] | undefined;
    if (parsedSkills && parsedSkills.length > 0) {
      for (const skillName of parsedSkills) {
        const searchRes = await this.skillsService.searchSkills({ query: skillName, limit: 1 });
        let skillId = searchRes.skills[0]?.id;

        if (!skillId) {
          let category = await this.prisma.skillCategory.findFirst({
            where: { name: "Other" }
          });
          if (!category) {
            category = await this.prisma.skillCategory.create({
              data: { name: "Other", description: "Uncategorized skills" }
            });
          }
          
          const newSkill = await this.prisma.skill.create({
            data: {
              name: skillName,
              categoryId: category.id,
              isVerified: false
            }
          });
          skillId = newSkill.id;
        }

        await this.skillsService.addSkill(userId, {
          skillId,
          proficiency: SkillProficiency.INTERMEDIATE,
          yearsOfExperience: 1,
        }).catch(e => this.logger.warn("Failed saving skill", e.message));
      }
    }

    // 5. Certifications
    const parsedCerts = parsedData.certifications as ParsedCert[] | undefined;
    if (parsedCerts && parsedCerts.length > 0) {
      for (const cert of parsedCerts) {
        if (!cert.name) continue;
        
        const searchRes = await this.certsService.searchCertifications({ query: cert.name, limit: 1 });
        let certId = searchRes.certifications[0]?.id;

        if (!certId) {
          const newCert = await this.prisma.certification.create({
            data: {
              name: cert.name,
              organization: cert.issuer || "Unknown",
              isVerified: false
            }
          });
          certId = newCert.id;
        }

        await this.certsService.addCertification(userId, {
          certificationId: certId,
          issueDate: cert.issueDate?.match(/^\d{4}-(0[1-9]|1[0-2])$/) ? cert.issueDate : "2020-01",
        }).catch(e => this.logger.warn("Failed saving certification", e.message));
      }
    }

    await this.profileService.getProfileCompletion(userId).catch(e =>
      this.logger.warn("Failed updating profile completion after AI import", e.message),
    );

    // Trigger asynchronous embedding for the parsed resume
    try {
      await this.aiQueue.add(AI_JOB_NAMES.EMBED_RESUME, { seekerId: userId });
    } catch (e) {
      this.logger.error("Failed adding embed-resume job to queue:", e);
    }

    return { message: "Resume parsed and profile updated successfully.", parsedData };
  }

  async generateBio(userId: string) {
    const profile = await this.profileService.getProfile(userId);
    const skillsRes = await this.skillsService.getSkills(userId);
    const expRes = await this.experienceService.getExperiences(userId);

    const skills = skillsRes.skills.map(s => s.skill.name);
    const experienceTitles = expRes.experiences.map(e => e.title);

    const aiUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
    const res = await fetch(`${aiUrl}/ai/profile/generate-bio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: profile.basicInfo.title || "Cybersecurity Professional",
        skills,
        experienceTitles,
      })
    });

    if (!res.ok) {
      throw new InternalServerErrorException("Failed to generate bio from AI service");
    }

    const cleanedBio = await res.text();

    // Autosave directly to DB
    await this.profileService.updateSummary(userId, {
      summary: cleanedBio
    });

    return { bio: cleanedBio, message: "Bio generated and saved successfully" };
  }

  async suggestSkills(userId: string) {
    const profile = await this.profileService.getProfile(userId);
    const skillsRes = await this.skillsService.getSkills(userId);
    const currentSkills = skillsRes.skills.map(s => s.skill.name);

    const aiUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
    const res = await fetch(`${aiUrl}/ai/profile/suggest-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: profile.basicInfo.title || "Cybersecurity Professional",
        currentSkills,
      })
    });

    if (!res.ok) {
      throw new InternalServerErrorException("Failed to suggest skills from AI service");
    }

    const skillsList = (await res.json()) as string[];
    
    // Autosave directly to DB
    const addedSkills = [];
    if (skillsList.length > 0) {
      for (const skillName of skillsList) {
        if (typeof skillName !== 'string') continue;
        const searchRes = await this.skillsService.searchSkills({ query: skillName, limit: 1 });
        if (searchRes.skills.length > 0) {
          const matchedSkill = searchRes.skills[0];
          await this.skillsService.addSkill(userId, {
            skillId: matchedSkill.id,
            proficiency: SkillProficiency.INTERMEDIATE,
            yearsOfExperience: 1,
          }).then(() => addedSkills.push(matchedSkill.name)).catch(e => this.logger.warn("Failed saving skill", e.message));
        }
      }
    }

    return { suggestions: skillsList, addedSkills, message: "Skills suggested and saved successfully" };
  }

  async getProfileTips(userId: string) {
    const profile = await this.profileService.getProfile(userId);
    const skillsRes = await this.skillsService.getSkills(userId);
    const expRes = await this.experienceService.getExperiences(userId);
    const eduRes = await this.educationService.getEducation(userId);

    const missingSections = [];
    if (!profile.summary) missingSections.push("Bio / Summary");
    if (skillsRes.total < 3) missingSections.push("Skills (needs more)");
    if (expRes.total === 0) missingSections.push("Experience");
    if (eduRes.total === 0) missingSections.push("Education");
    if (!profile.basicInfo.linkedin && !profile.basicInfo.github) missingSections.push("Social Links");

    if (missingSections.length === 0) {
       return { tips: ["Your profile is looking strong! Consider adding more detailed achievements to your experiences."] };
    }

    const aiUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
    const res = await fetch(`${aiUrl}/ai/profile/tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: profile.basicInfo.title || "Candidate",
        missingSections,
      })
    });

    if (!res.ok) {
      throw new InternalServerErrorException("Failed to generate tips from AI service");
    }

    const tips = (await res.json()) as string[];

    return { tips };
  }
}
