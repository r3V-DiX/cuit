import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@cykruit/prisma";
import { JobsQueryDto } from "./dto/jobs-query.dto";

import { Prisma } from "@prisma/client";

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly aiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiUrl = this.configService.get<string>('AI_SERVICE_URL') ?? 'http://localhost:3005';
  }

  async getJobs(dto: JobsQueryDto, userId?: string) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const selectOptions = {
      id: true,
      jobTitle: true,
      slug: true,
      jobType: true,
      workMode: true,
      experienceLevel: true,
      description: true,
      responsibilities: true,
      requirements: true,
      niceToHave: true,
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
            select: { id: true, name: true },
          },
        },
      },
      certifications: {
        select: {
          certification: {
            select: { id: true, name: true, organization: true },
          },
        },
      },
    };

    // Attempt Semantic Search if text is provided
    if (dto.search) {
      let searchVector: number[] | null = null;
      try {
        const res = await fetch(`${this.aiUrl}/ai/embed/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: dto.search })
        });
        if (res.ok) {
          const body = await res.json() as { vector: number[] };
          searchVector = body.vector;
        }
      } catch (err) {
        this.logger.warn(`Semantic search service unavailable, falling back to text search: ${String(err)}`);
      }

      if (searchVector) {
        const vectorStr = `[${searchVector.join(',')}]`;
        const conditions = [
          Prisma.sql`status = 'APPROVED'`,
          Prisma.sql`("expiresAt" IS NULL OR "expiresAt" > ${now})`
        ];

        if (dto.roleId) conditions.push(Prisma.sql`"roleId" = ${dto.roleId}`);
        if (dto.jobType) conditions.push(Prisma.sql`"jobType" = CAST(${dto.jobType} AS "JobType")`);
        if (dto.workMode) conditions.push(Prisma.sql`"workMode" = CAST(${dto.workMode} AS "WorkMode")`);
        if (dto.locationId) conditions.push(Prisma.sql`"locationId" = ${dto.locationId}`);
        if (dto.experienceLevel) conditions.push(Prisma.sql`"experienceLevel" = CAST(${dto.experienceLevel} AS "ExperienceLevel")`);

        const whereSql = Prisma.join(conditions, ' AND ');

        const rawIds = await this.prisma.$queryRaw<{id: string, total: bigint}[]>`
          WITH filtered AS (
            SELECT id, embedding FROM jobs WHERE ${whereSql}
          )
          SELECT id, count(*) OVER() as total
          FROM filtered
          ORDER BY embedding <-> ${vectorStr}::vector
          LIMIT ${limit} OFFSET ${skip}
        `;

        if (rawIds.length > 0) {
          const ids = rawIds.map(r => r.id);
          const total = Number(rawIds[0].total);
          
          const fetchedJobs = await this.prisma.job.findMany({
            where: { id: { in: ids } },
            select: selectOptions
          });

          // Sort strictly by the vector distance order
          fetchedJobs.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

          let matchMap = new Map<string, number>();
          if (userId) {
            const matches = await this.prisma.seekerJobMatch.findMany({
              where: { seekerId: userId, jobId: { in: ids } },
              select: { jobId: true, score: true }
            });
            matches.forEach(m => matchMap.set(m.jobId, m.score));
          }

          const formattedJobs = fetchedJobs.map((job) => ({
            ...job,
            matchScore: matchMap.get(job.id) ?? null,
            skills: job.skills.map((s) => s.skill).filter(Boolean),
            certifications: job.certifications.map((c) => c.certification).filter(Boolean),
          }));

          return {
            data: formattedJobs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };
        } else {
          return { data: [], total: 0, page, limit, totalPages: 0 };
        }
      }
    }

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

    if (dto.roleId) where.roleId = dto.roleId;
    if (dto.jobType) where.jobType = dto.jobType;
    if (dto.workMode) where.workMode = dto.workMode;
    if (dto.locationId) where.locationId = dto.locationId;
    if (dto.experienceLevel) where.experienceLevel = dto.experienceLevel;

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        select: selectOptions,
        orderBy: {
          publishedAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    let matchMap = new Map<string, number>();
    if (userId) {
      const ids = jobs.map(j => j.id);
      const matches = await this.prisma.seekerJobMatch.findMany({
        where: { seekerId: userId, jobId: { in: ids } },
        select: { jobId: true, score: true }
      });
      matches.forEach(m => matchMap.set(m.jobId, m.score));
    }

    // Format skills and certifications arrays
    const formattedJobs = jobs.map((job) => ({
      ...job,
      matchScore: matchMap.get(job.id) ?? null,
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
    const now = new Date();
    const job = await this.prisma.job.findFirst({
      where: {
        status: "APPROVED",
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
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
        responsibilities: true,
        requirements: true,
        niceToHave: true,
        publishedAt: true,
        expiresAt: true,
        viewCount: true,
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

      let shouldIncrement = true;

      if (userId) {
        // Only increment viewCount on first view per user
        const existing = await this.prisma.jobView.findUnique({
          where: { jobId_viewerId: { jobId, viewerId: userId } },
          select: { jobId: true },
        });
        if (existing) {
          shouldIncrement = false;
        } else {
          await this.prisma.jobView.create({ data: { jobId, viewerId: userId } });
        }
      }

      if (shouldIncrement) {
        await this.prisma.job.update({
          where: { id: jobId },
          data: { viewCount: { increment: 1 } },
        });
      }
    } catch (err) {
      this.logger.warn(`trackJobView failed for jobId=${jobId}: ${String(err)}`);
    }
  }

  async getMatchScore(jobId: string, seekerId: string) {
    const res = await fetch(`${this.aiUrl}/ai/match-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seekerId, jobId })
    });

    if (!res.ok) {
      // If AI service fails (e.g., missing embeddings), return null gracefully
      return { score: null };
    }

    return res.json();
  }
}
