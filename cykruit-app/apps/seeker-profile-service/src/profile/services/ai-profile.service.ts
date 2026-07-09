// apps/seeker-profile-service/src/profile/services/ai-profile.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { AIService, AI_PROMPTS, AITaskTier } from "@cykruit/ai";
import { z } from "zod";
import { ProfileService } from "./profile.service";
import { ExperienceService } from "./experience.service";
import { EducationService } from "./education.service";
import { SkillsService } from "./skills.service";
import { CertificationsService } from "./certifications.service";
import { SearchSkillsDto } from "../dto/skills/search-skills.dto";

const ResumeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  summary: z.string().optional(),
  experiences: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string().optional(),
        startDate: z.string().describe("Format: YYYY-MM"),
        endDate: z.string().optional().describe("Format: YYYY-MM or empty"),
        isCurrent: z.boolean(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        school: z.string(),
        startDate: z.string().optional().describe("Format: YYYY"),
        endDate: z.string().optional().describe("Format: YYYY"),
      }),
    )
    .optional(),
  skills: z.array(z.string()).optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        issueDate: z.string().optional(),
      }),
    )
    .optional(),
});

@Injectable()
export class AIProfileService {
  private readonly logger = new Logger(AIProfileService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly profileService: ProfileService,
    private readonly experienceService: ExperienceService,
    private readonly educationService: EducationService,
    private readonly skillsService: SkillsService,
    private readonly certsService: CertificationsService,
  ) {}

  async parseResumeAndApply(userId: string, pdfBuffer: Buffer) {
    this.logger.log(`Extracting text from PDF for user ${userId}`);
    const text = await this.aiService.extractTextFromPDF(pdfBuffer);
    
    this.logger.log(`Parsing extracted text via LangChain`);
    const parsedData = await this.aiService.generateStructured<z.infer<typeof ResumeSchema>>(
      AI_PROMPTS.RESUME_PARSE + "\n\n" + text.substring(0, 30000), // chunk to avoid overload
      ResumeSchema
    );

    this.logger.log(`Applying parsed data to DB`);
    
    // 1. Basic Info & Summary
    const basicInfo: any = {};
    if (parsedData.firstName) basicInfo.firstName = parsedData.firstName;
    if (parsedData.lastName) basicInfo.lastName = parsedData.lastName;
    if (parsedData.title) basicInfo.jobTitle = parsedData.title;
    if (parsedData.location) basicInfo.location = parsedData.location;
    if (parsedData.linkedin) basicInfo.linkedinUrl = parsedData.linkedin;
    if (parsedData.github) basicInfo.githubUrl = parsedData.github;
    if (parsedData.portfolio) basicInfo.portfolioUrl = parsedData.portfolio;
    if (parsedData.summary) basicInfo.bio = parsedData.summary;

    if (Object.keys(basicInfo).length > 0) {
      await this.profileService.updateBasicInfo(userId, basicInfo).catch(e => this.logger.warn("Failed basic info update", e.message));
    }

    // 2. Experiences
    if (parsedData.experiences && parsedData.experiences.length > 0) {
      for (const exp of parsedData.experiences) {
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
    if (parsedData.education && parsedData.education.length > 0) {
      for (const edu of parsedData.education) {
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
    if (parsedData.skills && parsedData.skills.length > 0) {
      for (const skillName of parsedData.skills) {
        const searchRes = await this.skillsService.searchSkills({ query: skillName, limit: 1 });
        if (searchRes.skills.length > 0) {
          const matchedSkill = searchRes.skills[0];
          await this.skillsService.addSkill(userId, {
            skillId: matchedSkill.id,
            proficiency: "Intermediate" as any, // default
            yearsOfExperience: 1,
          }).catch(e => this.logger.warn("Failed saving skill", e.message));
        }
      }
    }

    // 5. Certifications
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      for (const cert of parsedData.certifications) {
        if (!cert.name) continue;
        const validDate = cert.issueDate?.match(/^\d{4}-(0[1-9]|1[0-2])$/) ? cert.issueDate : undefined;
        
        const searchRes = await this.certsService.searchCertifications({ query: cert.name, limit: 1 });
        if (searchRes.certifications.length > 0) {
          const matchedCert = searchRes.certifications[0];
          await this.certsService.addCertification(userId, {
            certificationId: matchedCert.id,
            issueDate: validDate,
          }).catch(e => this.logger.warn("Failed saving cert", e.message));
        }
      }
    }

    return { message: "Resume parsed and profile updated successfully", parsedData };
  }

  async generateBio(userId: string) {
    const profile = await this.profileService.getProfile(userId);
    const skillsRes = await this.skillsService.getSkills(userId);
    const expRes = await this.experienceService.getExperiences(userId);

    const skills = skillsRes.skills.map(s => s.skill.name);
    const experienceTitles = expRes.experiences.map(e => e.title);

    const prompt = AI_PROMPTS.BIO_GENERATE({
      title: profile.basicInfo.title || "Cybersecurity Professional",
      skills,
      experienceTitles,
    });

    const res = await this.aiService.generate(prompt, { tier: AITaskTier.SMALL });
    
    let cleanedBio = res.text.trim();
    
    // Remove conversational filler if the AI ignores strict prompt instructions
    if (cleanedBio.toLowerCase().startsWith("here") || cleanedBio.toLowerCase().startsWith("sure") || cleanedBio.toLowerCase().startsWith("certainly")) {
      const parts = cleanedBio.split("\n\n");
      if (parts.length > 1) {
        parts.shift(); // Remove the introductory paragraph
        cleanedBio = parts.join("\n\n").trim();
      } else {
        cleanedBio = cleanedBio.replace(/^(here|sure|certainly).*?:/i, '').trim();
      }
    }
    
    // Remove wrapping quotes if present
    cleanedBio = cleanedBio.replace(/^["']|["']$/g, '').trim();

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

    const prompt = AI_PROMPTS.SKILL_SUGGEST({
      title: profile.basicInfo.title || "Cybersecurity Professional",
      currentSkills,
    });

    const schema = z.object({
      suggestions: z.array(z.string()).describe("Array of core technology names"),
    });

    const result = await this.aiService.generateStructured<any>(prompt, schema, { tier: AITaskTier.SMALL });
    
    // Normalize result (Ollama sometimes wraps or renames the key)
    let skillsList: string[] = [];
    if (Array.isArray(result)) {
      skillsList = result;
    } else if (result && typeof result === 'object') {
      skillsList = result.suggestions || result.output || result.skills || Object.values(result)[0] || [];
      if (!Array.isArray(skillsList)) skillsList = [];
    }
    
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
            proficiency: "Intermediate" as any, // default
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

    const prompt = AI_PROMPTS.PROFILE_TIPS({
      title: profile.basicInfo.title || "Candidate",
      missingSections,
    });

    // Simple text split for bullet points since prompt asks for exactly 3 bullets
    const res = await this.aiService.generate(prompt, { tier: AITaskTier.SMALL });
    const tips = res.text
        .split('\n')
        .map(t => t.replace(/^- /, '').replace(/^\* /, '').trim())
        .filter(t => t.length > 0);

    return { tips };
  }
}
