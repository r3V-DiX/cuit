import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { JobsQueryDto } from "./dto/jobs-query.dto";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async getJobs(dto: JobsQueryDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {
      status: "APPROVED",
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    };

    if (dto.search) {
      where.AND.push({
        OR: [
          { jobTitle: { contains: dto.search, mode: "insensitive" } },
          { employer: { companyName: { contains: dto.search, mode: "insensitive" } } },
        ],
      });
    }

    if (dto.roleId) {
      where.roleId = dto.roleId;
    }

    if (dto.jobType) {
      where.jobType = dto.jobType;
    }

    if (dto.workMode) {
      where.workMode = dto.workMode;
    }

    if (dto.locationId) {
      where.locationId = dto.locationId;
    }

    if (dto.experienceLevel) {
      where.experienceLevel = dto.experienceLevel;
    }

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        select: {
          id: true,
          jobTitle: true,
          slug: true,
          jobType: true,
          workMode: true,
          experienceLevel: true,
          description: true,
          publishedAt: true,
          expiresAt: true,
          employer: {
            select: {
              id: true,
              slug: true,
              companyName: true,
              companyLogo: true,
              isVerified: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          location: {
            select: {
              id: true,
              displayName: true,
              city: true,
              state: true,
              country: true,
            },
          },
          skills: {
            select: {
              skill: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          certifications: {
            select: {
              certification: {
                select: {
                  id: true,
                  name: true,
                  organization: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    // Format skills and certifications arrays
    const formattedJobs = jobs.map((job) => ({
      ...job,
      skills: job.skills.map((s) => s.skill).filter(Boolean),
      certifications: job.certifications
        .map((c) => c.certification)
        .filter(Boolean),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedJobs,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getJobBySlug(slugOrId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const job = await this.prisma.job.findFirst({
      where: {
        status: "APPROVED",
        OR: [
          { slug: slugOrId },
          ...(isUuid ? [{ id: slugOrId }] : []),
        ],
      },
      select: {
        id: true,
        jobTitle: true,
        slug: true,
        jobType: true,
        workMode: true,
        experienceLevel: true,
        description: true,
        applicationType: true,
        externalUrl: true,
        screeningQuestions: true,
        publishedAt: true,
        expiresAt: true,
        viewCount: true,
        applicationCount: true,
        employer: {
          select: {
            id: true,
            slug: true,
            companyName: true,
            companyLogo: true,
            isVerified: true,
            about: true,
            companyWebsite: true,
            foundedYear: true,
            companyType: true,
            industry: true,
            companySize: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        location: {
          select: {
            id: true,
            displayName: true,
            city: true,
            state: true,
            country: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        certifications: {
          select: {
            certification: {
              select: {
                id: true,
                name: true,
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException("Job listing not found");
    }

    // Format response to flatten relation tables
    return {
      ...job,
      skills: job.skills.map((s) => s.skill).filter(Boolean),
      certifications: job.certifications
        .map((c) => c.certification)
        .filter(Boolean),
    };
  }

  async trackJobView(jobId: string, userId?: string) {
    try {
      // Verify job exists and is approved first
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, status: "APPROVED" },
      });

      if (!job) return;

      if (userId) {
        // Create unique user view row (upsert ensures safety against concurrent updates)
        await this.prisma.jobView.upsert({
          where: {
            jobId_viewerId: {
              jobId,
              viewerId: userId,
            },
          },
          update: {},
          create: {
            jobId,
            viewerId: userId,
          },
        });
      }

      // Increment public viewCount
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch {
      // Never throw - fire and forget requirement
    }
  }
}
