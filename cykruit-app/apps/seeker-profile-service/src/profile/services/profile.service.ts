// apps/seeker-profile-service/src/profile/services/profile.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { UploadService } from "@cykruit/upload";
import { AppLogger } from "@cykruit/logger";
import {
  UserErrorCodes,
  LocationErrorCodes,
  UploadErrorCodes,
} from "@cykruit/common";
import { UPLOAD_CONFIGS } from "@cykruit/upload";
import { ProfileHelpers } from "../utils/profile.helpers";
import { UpdateBasicInfoDto } from "../dto/update-basic-info.dto";
import { UpdateSummaryDto } from "../dto/update-summary.dto";

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: ProfileHelpers,
    private readonly uploadService: UploadService,
    private readonly logger: AppLogger,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.helpers.getFullProfile(userId);
    const transformed = await this.helpers.transformToPresignedUrls(profile);
    const profileCompletion =
      await this.helpers.updateProfileCompletion(userId);

    return {
      basicInfo: {
        userId: transformed.userId,
        firstName: transformed.firstName,
        lastName: transformed.lastName,
        email: transformed.user.email,
        phone: transformed.user.phone,
        title: transformed.title,
        profileImage: transformed.user.profileImage,
        location: transformed.location
          ? {
              id: transformed.location.id,
              city: transformed.location.city,
              state: transformed.location.state,
              country: transformed.location.country,
              displayName: transformed.location.displayName,
            }
          : null,
        linkedin: transformed.linkedin,
        github: transformed.github,
        portfolio: transformed.portfolio,
        availability: transformed.availability,
      },
      summary: transformed.professionalSummary,
      experiences: transformed.experiences,
      education: transformed.education,
      skills: transformed.skills,
      certifications: transformed.certifications,
      projects: transformed.projects,
      ctfProfiles: transformed.ctfProfiles,
      resumes: transformed.resumes,
      profileCompletion,
      createdAt: transformed.createdAt,
      updatedAt: transformed.updatedAt,
    };
  }

  async updateBasicInfo(userId: string, dto: UpdateBasicInfoDto) {
    let finalLocationId: string | undefined;

    if (dto.locationId) {
      const exists = await this.prisma.location.findUnique({
        where: { id: dto.locationId },
      });
      if (!exists)
        throw new BadRequestException(LocationErrorCodes.LOCATION_NOT_FOUND);
      finalLocationId = dto.locationId;
    } else if (dto.location) {
      const existing = await this.prisma.location.findFirst({
        where: {
          city: dto.location.city,
          country: dto.location.country,
          ...(dto.location.state ? { state: dto.location.state } : {}),
        },
      });

      if (existing) {
        finalLocationId = existing.id;
      } else {
        try {
          const displayName = [
            dto.location.city,
            dto.location.state,
            dto.location.country,
          ]
            .filter(Boolean)
            .join(", ");
          const searchText = displayName.toLowerCase();

          const newLocation = await this.prisma.location.create({
            data: {
              city: dto.location.city,
              state: dto.location.state,
              country: dto.location.country,
              displayName,
              searchText,
            },
          });
          finalLocationId = newLocation.id;
        } catch {
          throw new BadRequestException(
            LocationErrorCodes.LOCATION_SERVICE_ERROR,
          );
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.firstName || dto.lastName) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName }),
          },
        });
      }

      await tx.jobSeekerProfile.update({
        where: { userId },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(finalLocationId !== undefined && { locationId: finalLocationId }),
          ...(dto.linkedin !== undefined && { linkedin: dto.linkedin }),
          ...(dto.github !== undefined && { github: dto.github }),
          ...(dto.portfolio !== undefined && { portfolio: dto.portfolio }),
          ...(dto.availability !== undefined && {
            availability: dto.availability,
          }),
        },
      });
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Basic info updated successfully" };
  }

  async updateSummary(userId: string, dto: UpdateSummaryDto) {
    await this.helpers.getProfileId(userId);

    await this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: { professionalSummary: dto.summary },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Summary updated successfully" };
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(UserErrorCodes.USER_NOT_FOUND);

    await this.helpers.deleteFileFromS3(user.profileImage);

    const uploadResult = await this.uploadService.uploadFile(
      file,
      UPLOAD_CONFIGS.PROFILE_IMAGE,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: uploadResult.fileUrl },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Profile image uploaded successfully" };
  }

  async deleteProfileImage(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(UserErrorCodes.USER_NOT_FOUND);
    if (!user.profileImage)
      throw new BadRequestException(UploadErrorCodes.FILE_NOT_FOUND);

    await this.helpers.deleteFileOrThrow(user.profileImage);

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Profile image deleted successfully" };
  }

  async getProfileCompletion(userId: string) {
    await this.helpers.getProfileId(userId);
    return this.helpers.updateProfileCompletion(userId);
  }
}
