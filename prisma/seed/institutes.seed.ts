import { PrismaClient } from '@prisma/client';

export async function seedInstitutes(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding institutes...');

    const { institutes } = require('../data/institutes.data');

    let count = 0;
    for (const inst of institutes) {
        try {
            await prisma.institute.upsert({
                where: { name: inst.name },
                update: {
                    city: inst.city,
                    state: inst.state || null,
                    country: inst.country,
                    isVerified: true,
                },
                create: {
                    name: inst.name,
                    city: inst.city,
                    state: inst.state || null,
                    country: inst.country,
                    isVerified: true,
                },
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert institute: ${inst.name}`, error);
        }
    }

    console.log(`✅ Seeded ${count} institutes`);
}
