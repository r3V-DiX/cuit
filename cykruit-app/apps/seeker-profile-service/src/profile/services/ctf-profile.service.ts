// apps/seeker-profile-service/src/profile/services/ctf-profile.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { GeneralErrorCodes } from "@cykruit/common";
import { ProfileHelpers } from "../utils/profile.helpers";
import { PROFILE_LIMITS } from "../utils/constants";
import { CreateCTFProfileDto } from "../dto/ctf/create-ctf-profile.dto";
import { UpdateCTFProfileDto } from "../dto/ctf/update-ctf-profile.dto";

@Injectable()
export class CTFProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: ProfileHelpers,
  ) {}

  async getCTFProfiles(userId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const ctfProfiles = await this.prisma.cTFProfile.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
    return { ctfProfiles, total: ctfProfiles.length };
  }

  async getCTFProfileById(userId: string, ctfProfileId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const ctfProfile = await this.prisma.cTFProfile.findUnique({
      where: { id: ctfProfileId },
    });
    if (!ctfProfile) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      ctfProfile.profileId,
      profileId,
      "CTF profile",
    );
    return ctfProfile;
  }

  async createCTFProfile(userId: string, dto: CreateCTFProfileDto) {
    const profileId = await this.helpers.getProfileId(userId);

    await this.helpers.checkItemLimit(
      profileId,
      "cTFProfile",
      PROFILE_LIMITS.MAX_CTF_PROFILES,
      "CTF profiles",
    );

    await this.prisma.cTFProfile.create({
      data: {
        profileId,
        platform: dto.platform,
        username: dto.username,
        profileUrl: dto.profileUrl,
        rank: dto.rank,
        points: dto.points,
      },
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "CTF profile added successfully" };
  }

  async updateCTFProfile(
    userId: string,
    ctfProfileId: string,
    dto: UpdateCTFProfileDto,
  ) {
    const profileId = await this.helpers.getProfileId(userId);
    const existing = await this.prisma.cTFProfile.findUnique({
      where: { id: ctfProfileId },
    });
    if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      existing.profileId,
      profileId,
      "CTF profile",
    );

    await this.prisma.cTFProfile.update({
      where: { id: ctfProfileId },
      data: dto,
    });

    await this.helpers.updateProfileCompletion(userId);

    return { message: "CTF profile updated successfully" };
  }

  async deleteCTFProfile(userId: string, ctfProfileId: string) {
    const profileId = await this.helpers.getProfileId(userId);
    const existing = await this.prisma.cTFProfile.findUnique({
      where: { id: ctfProfileId },
    });
    if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
    this.helpers.validateOwnership(
      existing.profileId,
      profileId,
      "CTF profile",
    );

    await this.prisma.cTFProfile.delete({ where: { id: ctfProfileId } });
    await this.helpers.updateProfileCompletion(userId);

    return { message: "CTF profile deleted successfully" };
  }
}
