// apps/seeker-profile-service/src/profile/services/experience.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { GeneralErrorCodes } from "@cykruit/common";
import { ProfileHelpers } from "../utils/profile.helpers";
import { ValidationHelpers } from "../utils/validation.helpers";
import { PROFILE_LIMITS } from "../utils/constants";
import { CreateExperienceDto } from "../dto/experience/create-experience.dto";
import { UpdateExperienceDto } from "../dto/experience/update-experience.dto";

@Injectable()
export class ExperienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: ProfileHelpers,
  ) {}

  async getExperiences(userId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const experiences = await this.prisma.experience.findMany({
      where: { profileId },
      orderBy: [{ current: "desc" }, { startDate: "desc" }],
    });
    return { experiences, total: experiences.length };
  }

  async getExperienceById(userId: string, experienceId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });
    if (!experience) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      experience.profileId,
      profileId,
      "experience",
    );
    return experience;
  }

  async createExperience(userId: string, dto: CreateExperienceDto) {
    const profileId = await this.helpers.getProfileId(userId);

    await this.helpers.checkItemLimit(
      profileId,
      "experience",
      PROFILE_LIMITS.MAX_EXPERIENCES,
      "experiences",
    );
    this.validateExperienceDates(dto.startDate, dto.endDate, dto.current);

    await this.prisma.experience.create({
      data: {
        profileId,
        title: dto.title,
        company: dto.company,
        location: dto.location,
        employmentType: dto.employmentType,
        startDate: dto.startDate,
        endDate: dto.current ? null : dto.endDate,
        current: dto.current,
        description: dto.description,
        tools: dto.tools,
        achievements: dto.achievements || [],
      },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Experience added successfully" };
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    dto: UpdateExperienceDto,
  ) {
    const profileId = await this.helpers.getProfileId(userId);

    const existing = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });
    if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(existing.profileId, profileId, "experience");

    if (
      dto.startDate !== undefined ||
      dto.endDate !== undefined ||
      dto.current !== undefined
    ) {
      const startDate = dto.startDate ?? existing.startDate;
      const endDate =
        dto.endDate !== undefined ? dto.endDate : existing.endDate;
      const current =
        dto.current !== undefined ? dto.current : existing.current;
      this.validateExperienceDates(startDate, endDate, current);
    }

    await this.prisma.experience.update({
      where: { id: experienceId },
      data: { ...dto, endDate: dto.current ? null : dto.endDate },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Experience updated successfully" };
  }

  async deleteExperience(userId: string, experienceId: string) {
    const profileId = await this.helpers.getProfileId(userId);

    const existing = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });
    if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(existing.profileId, profileId, "experience");

    await this.prisma.experience.delete({ where: { id: experienceId } });
    await this.helpers.updateProfileCompletion(userId);

    return { message: "Experience deleted successfully" };
  }

  private validateExperienceDates(
    startDate: string,
    endDate: string | null | undefined,
    current: boolean,
  ): void {
    ValidationHelpers.validateCurrentDateLogic(current, endDate, "job");
    const normalizedEndDate =
      endDate === "" || endDate === null || endDate === undefined
        ? null
        : endDate;
    if (!current && normalizedEndDate) {
      ValidationHelpers.validateYearMonthRange(startDate, normalizedEndDate);
    } else {
      ValidationHelpers.validateYearMonthFormat(startDate);
    }
  }
}
