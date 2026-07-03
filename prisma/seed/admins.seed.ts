import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedAdmins(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding admin users...');

    const { admins } = require('../data/admin.data');

    let count = 0;
    for (const admin of admins) {
        try {
            const hashedPassword = await bcrypt.hash(admin.password, 10);

            await prisma.admin.upsert({
                where: { email: admin.email },
                update: {
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                },
                create: {
                    email: admin.email,
                    password: hashedPassword,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                },
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert admin user: ${admin.email}`, error);
        }
    }

    console.log(`✅ Seeded ${count} admin users`);
}
