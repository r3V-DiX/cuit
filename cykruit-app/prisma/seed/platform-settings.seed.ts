import { PrismaClient } from '@prisma/client';

const DEFAULT_SETTINGS = [
    {
        key: 'maintenance_mode',
        value: 'false',
        description: 'When true, the platform shows a maintenance page to non-admin users.',
    },
    {
        key: 'registration_enabled',
        value: 'true',
        description: 'When false, new seeker/employer registration is disabled.',
    },
    {
        key: 'job_posting_enabled',
        value: 'true',
        description: 'When false, employers cannot create new job postings.',
    },
    {
        key: 'kyc_required',
        value: 'true',
        description: 'When true, employers must complete KYC verification before posting jobs.',
    },
];

export async function seedPlatformSettings(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding platform settings...');

    let count = 0;
    for (const setting of DEFAULT_SETTINGS) {
        try {
            await prisma.platformSetting.upsert({
                where: { key: setting.key },
                update: { description: setting.description },
                create: setting,
            });
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert platform setting: ${setting.key}`, error);
        }
    }

    console.log(`✅ Seeded ${count} platform settings`);
}
