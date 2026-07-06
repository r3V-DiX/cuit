import { PrismaClient } from '@prisma/client';

export async function seedCertifications(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding certifications...');

    const { certifications } = require('../data/certifications.data');

    let count = 0;
    for (const cert of certifications) {
        try {
            await prisma.certification.upsert({
                where: { name: cert.name },
                update: {
                    organization: cert.organization,
                    description: cert.description,
                    isVerified: true,
                },
                create: {
                    name: cert.name,
                    organization: cert.organization,
                    description: cert.description,
                    isVerified: true,
                },
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert certification: ${cert.name}`, error);
        }
    }

    console.log(`✅ Seeded ${count} certifications`);
}
