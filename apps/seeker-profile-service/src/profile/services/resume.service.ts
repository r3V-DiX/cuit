// apps/seeker-profile-service/src/profile/services/resume.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { UploadService } from "@cykruit/upload";
import { GeneralErrorCodes } from "@cykruit/common";
import { UPLOAD_CONFIGS } from "@cykruit/upload";
import { ProfileHelpers } from "../utils/profile.helpers";
import { PROFILE_LIMITS } from "../utils/constants";

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly helpers: ProfileHelpers,
  ) {}

  async getResumes(userId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const resumes = await this.prisma.resume.findMany({
      where: { profileId },
      orderBy: { uploadedAt: "desc" },
    });
    const transformed = await this.helpers.transformToPresignedUrls(resumes);
    return { resumes: transformed, total: transformed.length };
  }

  async getResumeById(userId: string, resumeId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });
    if (!resume) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(resume.profileId, profileId, "resume");
    const transformed = await this.helpers.transformToPresignedUrls(resume);
    return transformed;
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    const profileId = await this.helpers.getProfileId(userId);

    await this.helpers.checkItemLimit(
      profileId,
      "resume",
      PROFILE_LIMITS.MAX_RESUMES,
      "resumes. Please delete an existing resume first",
    );

    const uploadResult = await this.uploadService.uploadFile(
      file,
      UPLOAD_CONFIGS.RESUME,
    );

    await this.prisma.resume.create({
      data: {
        profileId,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
      },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "Resume uploaded successfully" };
  }

  async replaceResume(
    userId: string,
    resumeId: string,
    file: Express.Multer.File,
  ) {
    const profileId = await this.helpers.getProfileId(userId);
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });
    if (!resume) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(resume.profileId, profileId, "resume");

    await this.helpers.deleteFileFromS3(resume.fileUrl);
    const uploadResult = await this.uploadService.uploadFile(
      file,
      UPLOAD_CONFIGS.RESUME,
    );

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        uploadedAt: new Date(),
      },
    });

    return { message: "Resume replaced successfully" };
  }

  async deleteResume(userId: string, resumeId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });
    if (!resume) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(resume.profileId, profileId, "resume");

    await this.helpers.deleteFileOrThrow(resume.fileUrl);
    await this.prisma.resume.delete({ where: { id: resumeId } });
    await this.helpers.updateProfileCompletion(userId);

    return { message: "Resume deleted successfully" };
  }
}
