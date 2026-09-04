import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { ProfileVisibility } from "@prisma/client";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeekerProfile(
    userId: string,
    tracking?: { viewerId?: string; ip?: string; userAgent?: string }
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: "SEEKER",
        status: "ACTIVE",
      },
      include: {
        jobSeekerSettings: true,
        jobSeekerProfile: {
          include: {
            location: true,
            skills: {
              include: {
                skill: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            experiences: true,
            education: {
              include: {
                institute: true,
              },
            },
            certifications: {
              include: {
                certification: true,
              },
            },
            projects: true,
            ctfProfiles: true,
          },
        },
      },
    });

    if (!user || !user.jobSeekerProfile) {
      throw new NotFoundException("Profile not found");
    }

    const visibility =
      user.jobSeekerSettings?.profileVisibility ?? ProfileVisibility.PUBLIC;

    const isOwner = tracking?.viewerId === user.id;

    // 🔒 PRIVATE → return friendly private response for external visitors, or allow owner preview
    if (visibility === ProfileVisibility.PRIVATE && !isOwner) {
      return {
        data: {
          id: user.id,
          isPrivate: true,
          message: "This profile is currently set to private.",
        },
        message: "This profile is currently set to private.",
      };
    }

    const profile = user.jobSeekerProfile;

    // Track view asynchronously if it's not the user viewing their own profile
    if (tracking && tracking.viewerId !== user.id) {
      this.prisma.profileView.create({
        data: {
          profileId: profile.id,
          viewerType: tracking.viewerId ? "USER" : "GUEST",
          viewerId: tracking.viewerId || null,
          ipAddress: tracking.ip || null,
          userAgent: tracking.userAgent || null,
        }
      }).catch(err => {
        console.error("Failed to track profile view", err);
      });
    }

    // 🕵️ ANONYMOUS → return skills only
    if (visibility === ProfileVisibility.ANONYMOUS) {
      const ANONYMOUS_AVATAR =
        "https://ui-avatars.com/api/?name=Anonymous&background=CBD5E1&color=475569&size=200";
      return {
        id: user.id,
        firstName: "",
        lastName: "",
        profileImage: ANONYMOUS_AVATAR,
        title: null,
        professionalSummary: null,
        location: null,
        availability: profile.availability,
        profileCompletion: profile.profileCompletion,
        createdAt: profile.createdAt,
        skills: profile.skills.map((s) => ({
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category?.name || null,
        })),
        experiences: [],
        education: [],
        certifications: [],
        projects: [],
        ctfProfiles: [],
        anonymity: {
          isAnonymous: true,
          label: "Anonymous Profile",
          description:
            "This candidate has chosen to keep their identity private. Skills and experience are verified.",
        },
      };
    }

    // 🔓 PUBLIC → return full details
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      title: profile.title,
      professionalSummary: profile.professionalSummary,
      location: profile.location?.displayName || null,
      availability: profile.availability,
      profileCompletion: profile.profileCompletion,
      createdAt: profile.createdAt,
      skills: profile.skills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        category: s.skill.category?.name || null,
      })),
      experiences: profile.experiences,
      education: profile.education.map((e) => ({
        id: e.id,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        instituteName: e.instituteName || e.institute?.name || null,
        startDate: e.startDate,
        endDate: e.endDate,
        grade: e.grade,
        description: e.description,
      })),
      certifications: profile.certifications.map((c) => ({
        id: c.certification.id,
        name: c.certification.name,
        organization: c.certification.organization,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        credentialId: c.credentialId,
        certificateFile: c.certificateFile,
      })),
      projects: profile.projects,
      ctfProfiles: profile.ctfProfiles,
      anonymity: {
        isAnonymous: false,
      },
      isPrivate: visibility === ProfileVisibility.PRIVATE,
      isOwner,
    };
  }

  async getCompanyProfile(slug: string) {
    const now = new Date();
    const employer = await this.prisma.employer.findFirst({
      where: {
        slug,
        isVerified: true,
        profileCompletion: {
          gte: 50,
        },
      },
      include: {
        officeLocations: true,
        benefits: true,
        teamMembers: true,
        companyMedia: true,
        jobs: {
          where: {
            status: "APPROVED",
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
    });

    if (!employer) {
      throw new NotFoundException("Company profile not found");
    }

    return {
      id: employer.id,
      slug: employer.slug,
      companyName: employer.companyName,
      tagline: employer.tagline,
      companyLogo: employer.companyLogo,
      companyBanner: employer.companyBanner,
      isVerified: employer.isVerified,
      industry: employer.industry,
      companyType: employer.companyType,
      companySize: employer.companySize,
      foundedYear: employer.foundedYear,
      location: employer.location,
      about: employer.about,
      mission: employer.mission,
      vision: employer.vision,
      cultureDescription: employer.cultureDescription,
      website: employer.companyWebsite,
      contactEmail: employer.contactEmail,
      linkedin: employer.linkedin,
      twitter: employer.twitter,
      facebook: employer.facebook,
      instagram: employer.instagram,
      officeLocations: employer.officeLocations,
      benefits: employer.benefits,
      teamMembers: employer.teamMembers.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        profileImage: t.profileImage,
      })),
      media: employer.companyMedia,
      activeJobCount: employer.jobs.length,
      profileCompletion: employer.profileCompletion,
      createdAt: employer.createdAt,
    };
  }
}
