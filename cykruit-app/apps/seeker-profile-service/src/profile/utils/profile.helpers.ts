// apps/seeker-profile-service/src/profile/utils/profile.helpers.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { UploadService } from "@cykruit/upload";
import {
  JobSeekerCompletionService,
  JobSeekerCompletionResult,
} from "@cykruit/common";
import { AppLogger } from "@cykruit/logger";
import { UserErrorCodes, UploadErrorCodes } from "@cykruit/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { AI_QUEUES, AI_JOB_NAMES } from "@cykruit/ai";

@Injectable()
export class ProfileHelpers {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly completionService: JobSeekerCompletionService,
    private readonly logger: AppLogger,
    @InjectQueue(AI_QUEUES.AI_JOBS) private readonly aiQueue: Queue,
  ) {}

  // ── Profile lookups ───────────────────────────────────────────

  async getProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException(UserErrorCodes.PROFILE_NOT_FOUND);
    return profile.id;
  }

  async getFullProfile(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profileImage: true,
            role: true,
            status: true,
            isEmailVerified: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        location: true,
        experiences: true,
        education: { include: { institute: true } },
        skills: { include: { skill: { include: { category: true } } } },
        certifications: { include: { certification: true } },
        projects: true,
        ctfProfiles: true,
        resumes: true,
      },
    });

    if (!profile) throw new NotFoundException(UserErrorCodes.PROFILE_NOT_FOUND);
    return profile;
  }

  // ── Profile completion ────────────────────────────────────────

  async updateProfileCompletion(
    userId: string,
  ): Promise<JobSeekerCompletionResult> {
    const profile = await this.getFullProfile(userId);
    const completion =
      await this.completionService.calculateCompletion(profile);

    await this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: { profileCompletion: completion.percentage },
    });

    if (completion.percentage >= 70) {
      try {
        await this.aiQueue.add(
          AI_JOB_NAMES.EMBED_RESUME, 
          { seekerId: userId },
          { 
            jobId: `embed-resume-${userId}`,
            delay: 10000, 
            removeOnComplete: true 
          }
        );
      } catch (e: any) {
        this.logger.error(
          "Failed adding embed-resume job to queue:",
          e instanceof Error ? e.stack : String(e),
          "ProfileHelpers",
        );
      }
    }

    return completion;
  }

  // ── Ownership validation ──────────────────────────────────────

  validateOwnership(
    resourceProfileId: string,
    userProfileId: string,
    resourceType = "resource",
  ): void {
    if (resourceProfileId !== userProfileId)
      throw new ForbiddenException(
        `You do not have access to this ${resourceType}`,
      );
  }

  // ── Item limits ───────────────────────────────────────────────

  async checkItemLimit(
    profileId: string,
    tableName: string,
    maxItems: number,
    itemName: string,
  ): Promise<void> {
    const count = await (this.prisma[tableName] as any).count({
      where: { profileId },
    });
    if (count >= maxItems)
      throw new BadRequestException(
        `Cannot add more than ${maxItems} ${itemName}`,
      );
  }

  // ── File operations ───────────────────────────────────────────

  async deleteFileFromS3(fileUrl: string | null): Promise<void> {
    if (!fileUrl) return;
    try {
      const key = this.uploadService.extractKeyFromUrl(fileUrl);
      const bucket = this.uploadService.getBucketTypeFromUrl(fileUrl);
      await this.uploadService.deleteFile({ key, bucket });
    } catch {
      this.logger.warn(
        `Failed to delete file from S3: ${fileUrl}`,
        "ProfileHelpers",
      );
    }
  }

  async deleteFileOrThrow(fileUrl: string): Promise<void> {
    try {
      const key = this.uploadService.extractKeyFromUrl(fileUrl);
      const bucket = this.uploadService.getBucketTypeFromUrl(fileUrl);
      await this.uploadService.deleteFile({ key, bucket });
    } catch (error) {
      this.logger.error(
        `Error deleting file from S3: ${fileUrl}`,
        error.stack,
        "ProfileHelpers",
      );
      throw new BadRequestException(UploadErrorCodes.FILE_DELETE_FAILED);
    }
  }

  // ── URL transforms ────────────────────────────────────────────

  async transformToPresignedUrls<T>(data: T): Promise<T>;
  async transformToPresignedUrls<T>(data: T[]): Promise<T[]>;
  async transformToPresignedUrls<T>(data: T | T[]): Promise<T | T[]> {
    return this.uploadService.transformFileUrls(data as any) as any;
  }

  // ── Entity validation ─────────────────────────────────────────

  async validateEntityExists(
    model: string,
    id: string,
    errorMessage?: string,
  ): Promise<void> {
    const entity = await (this.prisma[model] as any).findUnique({
      where: { id },
    });
    if (!entity)
      throw new BadRequestException(errorMessage || `Invalid ${model} ID`);
  }

  async checkUniqueConstraint(
    model: string,
    where: any,
    errorMessage?: string,
  ): Promise<void> {
    const existing = await (this.prisma[model] as any).findUnique({ where });
    if (existing)
      throw new BadRequestException(
        errorMessage || "This record already exists",
      );
  }
}
