import { PrismaClient, Prisma } from '@prisma/client';

const PACKAGES = [
    {
        name: 'Free',
        description: 'Get started — ideal for small teams trying the platform',
        isActive: true,
        maxActiveJobs: 3,
        maxTeamMembers: 2,
        featuredJobSlots: 0,
        aiScoringEnabled: false,
        priceMonthly: null,
        priceYearly: null,
    },
    {
        name: 'Starter',
        description: 'For growing teams actively hiring',
        isActive: true,
        maxActiveJobs: 10,
        maxTeamMembers: 5,
        featuredJobSlots: 1,
        aiScoringEnabled: false,
        priceMonthly: new Prisma.Decimal('29.99'),
        priceYearly: new Prisma.Decimal('299.00'),
    },
    {
        name: 'Growth',
        description: 'Scale your hiring with AI-assisted screening',
        isActive: true,
        maxActiveJobs: 30,
        maxTeamMembers: 15,
        featuredJobSlots: 3,
        aiScoringEnabled: true,
        priceMonthly: new Prisma.Decimal('79.99'),
        priceYearly: new Prisma.Decimal('799.00'),
    },
    {
        name: 'Enterprise',
        description: 'Unlimited hiring for large organisations',
        isActive: true,
        maxActiveJobs: 200,
        maxTeamMembers: 100,
        featuredJobSlots: 10,
        aiScoringEnabled: true,
        priceMonthly: new Prisma.Decimal('249.99'),
        priceYearly: new Prisma.Decimal('2499.00'),
    },
];

export async function seedSubscriptionPackages(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding subscription packages...');

    let count = 0;
    for (const pkg of PACKAGES) {
        try {
            await prisma.subscriptionPackage.upsert({
                where: { name: pkg.name },
                update: {
                    description: pkg.description,
                    isActive: pkg.isActive,
                    maxActiveJobs: pkg.maxActiveJobs,
                    maxTeamMembers: pkg.maxTeamMembers,
                    featuredJobSlots: pkg.featuredJobSlots,
                    aiScoringEnabled: pkg.aiScoringEnabled,
                    priceMonthly: pkg.priceMonthly,
                    priceYearly: pkg.priceYearly,
                },
                create: pkg,
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert package: ${pkg.name}`, error);
        }
    }

    console.log(`✅ Seeded ${count} subscription packages`);
}
