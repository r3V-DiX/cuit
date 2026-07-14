// apps/seeker-profile-service/src/profile/services/certifications.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { UploadService } from "@cykruit/upload";
import { GeneralErrorCodes, UploadErrorCodes } from "@cykruit/common";
import { UPLOAD_CONFIGS } from "@cykruit/upload";
import { ProfileHelpers } from "../utils/profile.helpers";
import { PROFILE_LIMITS } from "../utils/constants";
import { AddCertificationDto } from "../dto/certifications/add-certification.dto";
import { UpdateCertificationDto } from "../dto/certifications/update-certification.dto";
import { SearchCertificationsDto } from "../dto/certifications/search-certifications.dto";
import { ValidationHelpers } from "../utils/validation.helpers";

@Injectable()
export class CertificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly helpers: ProfileHelpers,
  ) {}

  async getCertifications(userId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const certifications = await this.prisma.jobSeekerCertification.findMany({
      where: { profileId },
      include: { certification: true },
      orderBy: { issueDate: "desc" },
    });
    const transformed =
      await this.helpers.transformToPresignedUrls(certifications);
    return { certifications: transformed, total: transformed.length };
  }

  async getCertificationById(userId: string, certificationId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const certification = await this.prisma.jobSeekerCertification.findUnique({
      where: { id: certificationId },
      include: { certification: true },
    });
    if (!certification)
      throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      certification.profileId,
      profileId,
      "certification",
    );
    const transformed =
      await this.helpers.transformToPresignedUrls(certification);
    return transformed;
  }

  async addCertification(userId: string, dto: AddCertificationDto) {
    const profileId = await this.helpers.getProfileId(userId);

    await this.helpers.checkItemLimit(
      profileId,
      "jobSeekerCertification",
      PROFILE_LIMITS.MAX_CERTIFICATIONS,
      "certifications",
    );
    await this.helpers.validateEntityExists(
      "certification",
      dto.certificationId,
      "Invalid certification ID",
    );
    await this.helpers.checkUniqueConstraint(
      "jobSeekerCertification",
      {
        profileId_certificationId: {
          profileId,
          certificationId: dto.certificationId,
        },
      },
      "You have already added this certification",
    );

    if (dto.expiryDate) {
      ValidationHelpers.validateYearMonthRange(
        dto.issueDate,
        dto.expiryDate,
        "Issue date",
        "Expiry date",
      );
    }

    const cert = await this.prisma.jobSeekerCertification.create({
      data: {
        profileId,
        certificationId: dto.certificationId,
        issueDate: dto.issueDate,
        expiryDate: dto.expiryDate,
        credentialId: dto.credentialId,
        credentialUrl: dto.credentialUrl,
      },
      include: { certification: true },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: `${cert.certification.name} added successfully` };
  }

  async updateCertification(
    userId: string,
    certificationId: string,
    dto: UpdateCertificationDto,
  ) {
    const profileId = await this.helpers.getProfileId(userId);
    const existing = await this.prisma.jobSeekerCertification.findUnique({
      where: { id: certificationId },
      include: { certification: true },
    });
    if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      existing.profileId,
      profileId,
      "certification",
    );

    if (dto.issueDate !== undefined || dto.expiryDate !== undefined) {
      const issueDate = dto.issueDate ?? existing.issueDate;
      const expiryDate = dto.expiryDate !== undefined ? dto.expiryDate : existing.expiryDate;
      if (expiryDate)
        ValidationHelpers.validateYearMonthRange(
          issueDate,
          expiryDate,
          "Issue date",
          "Expiry date",
        );
    }

    await this.prisma.jobSeekerCertification.update({
      where: { id: certificationId },
      data: dto,
    });

    return { message: `${existing.certification.name} updated successfully` };
  }

  async deleteCertification(userId: string, certificationId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const existing = await this.prisma.jobSeekerCertification.findUnique({
      where: { id: certificationId },
      include: { certification: true },
    });
    if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      existing.profileId,
      profileId,
      "certification",
    );

    await this.helpers.deleteFileFromS3(existing.certificateFile);
    await this.prisma.jobSeekerCertification.delete({
      where: { id: certificationId },
    });
    await this.helpers.updateProfileCompletion(userId);

    return { message: `${existing.certification.name} deleted successfully` };
  }

  async uploadCertificateFile(
    userId: string,
    certificationId: string,
    file: Express.Multer.File,
  ) {
    const profileId = await this.helpers.getProfileId(userId);
    const certification = await this.prisma.jobSeekerCertification.findUnique({
      where: { id: certificationId },
    });
    if (!certification)
      throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      certification.profileId,
      profileId,
      "certification",
    );

    await this.helpers.deleteFileFromS3(certification.certificateFile);
    const uploadResult = await this.uploadService.uploadFile(
      file,
      UPLOAD_CONFIGS.CERTIFICATE,
    );

    await this.prisma.jobSeekerCertification.update({
      where: { id: certificationId },
      data: { certificateFile: uploadResult.fileUrl },
    });

    return { message: "Certificate uploaded successfully" };
  }

  async deleteCertificateFile(userId: string, certificationId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const certification = await this.prisma.jobSeekerCertification.findUnique({
      where: { id: certificationId },
    });
    if (!certification)
      throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      certification.profileId,
      profileId,
      "certification",
    );
    if (!certification.certificateFile)
      throw new NotFoundException(UploadErrorCodes.FILE_NOT_FOUND);

    await this.helpers.deleteFileOrThrow(certification.certificateFile);
    await this.prisma.jobSeekerCertification.update({
      where: { id: certificationId },
      data: { certificateFile: null },
    });

    return { message: "Certificate file deleted successfully" };
  }

  async searchCertifications(dto: SearchCertificationsDto) {
    const { query, organization, limit = 20 } = dto;
    const certifications = await this.prisma.certification.findMany({
      where: {
        ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
        ...(organization
          ? { organization: { contains: organization, mode: "insensitive" } }
          : {}),
      },
      take: Number(limit) || 20,
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    });
    return { certifications, total: certifications.length };
  }
}
