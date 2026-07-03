import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding job roles...');

    const rolesData = require('../data/roles.data');

    let count = 0;
    for (const role of rolesData) {
        try {
            await prisma.role.upsert({
                where: { name: role.name },
                update: {
                    category: role.category,
                    description: role.description,
                    isActive: true,
                },
                create: {
                    name: role.name,
                    category: role.category,
                    description: role.description,
                    isActive: true,
                },
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert role: ${role.name}`, error);
        }
    }

    console.log(`✅ Seeded ${count} job roles`);
}
