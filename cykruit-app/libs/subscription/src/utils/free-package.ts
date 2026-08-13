import { PrismaService } from '@cykruit/prisma';

/**
 * Find the Free-tier package. Uses a single source of truth across the
 * subscription-service (payment.repository) and the shared limits lib.
 * The Free package is identified by `name === 'Free'` (the seed's canonical marker).
 * Returns null if no such package exists — callers must fall back to FREE_LIMITS.
 */
export async function findFreePackage(
  prisma: PrismaService,
): Promise<{ id: string; name: string; maxActiveJobs: number; maxTeamMembers: number; featuredJobSlots: number; aiScoringEnabled: boolean; jobPostingPeriodDays: number; resumeViewEnabled: boolean; canExportApplicants: boolean; analyticsEnabled: boolean; prioritySupportEnabled: boolean } | null> {
  return prisma.subscriptionPackage.findFirst({
    where: { name: 'Free' },
    select: {
      id: true,
      name: true,
      maxActiveJobs: true,
      maxTeamMembers: true,
      featuredJobSlots: true,
      aiScoringEnabled: true,
      jobPostingPeriodDays: true,
      resumeViewEnabled: true,
      canExportApplicants: true,
      analyticsEnabled: true,
      prioritySupportEnabled: true,
    },
  });
}