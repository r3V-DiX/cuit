import { PrismaClient } from '@prisma/client';

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function seedRoles(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding job roles...');

    const rolesData = require('../data/roles.data');

    let count = 0;
    for (const role of rolesData) {
        try {
            // domainId is nullable — connectOrCreate here runs before any Admin exists
            // in a fresh seed, so system-created domains get createdBy: null.
            const domainRelation = role.category
                ? {
                      domain: {
                          connectOrCreate: {
                              where: { name: role.category },
                              create: { name: role.category, slug: slugify(role.category) },
                          },
                      },
                  }
                : {};

            await prisma.role.upsert({
                where: { name: role.name },
                update: {
                    description: role.description,
                    isActive: true,
                    ...domainRelation,
                },
                create: {
                    name: role.name,
                    description: role.description,
                    isActive: true,
                    ...domainRelation,
                },
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert role: ${role.name}`, error);
        }
    }

    console.log(`✅ Seeded ${count} job roles`);
}
