import { PrismaClient } from '@prisma/client';
import { seedLocations } from './locations.seed';
import { seedSkills } from './skills.seed';
import { seedCertifications } from './certifications.seed';
import { seedInstitutes } from './institutes.seed';
import { seedRoles } from './roles.seed';
import { seedAdmins } from './admins.seed';
import { seedSubscriptionPackages } from './subscriptions.seed';
import { seedTestimonials } from './testimonials.seed';
import { seedJobs } from './jobs.seed';

const prisma = new PrismaClient();

async function main() {
    console.log('\n================================================');
    console.log('        🚀 Cykruit Database Seeder (TS)');
    console.log('================================================');

    try {
        await seedLocations(prisma);
    } catch (e) {
        console.error('❌ Locations seeding failed:', e);
    }

    try {
        await seedSkills(prisma);
    } catch (e) {
        console.error('❌ Skills seeding failed:', e);
    }

    try {
        await seedCertifications(prisma);
    } catch (e) {
        console.error('❌ Certifications seeding failed:', e);
    }

    try {
        await seedInstitutes(prisma);
    } catch (e) {
        console.error('❌ Institutes seeding failed:', e);
    }

    try {
        await seedRoles(prisma);
    } catch (e) {
        console.error('❌ Roles seeding failed:', e);
    }

    try {
        await seedAdmins(prisma);
    } catch (e) {
        console.error('❌ Admins seeding failed:', e);
    }

    try {
        await seedSubscriptionPackages(prisma);
    } catch (e) {
        console.error('❌ Subscription packages seeding failed:', e);
    }

    try {
        await seedTestimonials(prisma);
    } catch (e) {
        console.error('❌ Testimonials seeding failed:', e);
    }

    try {
        await seedJobs(prisma);
    } catch (e) {
        console.error('❌ Jobs seeding failed:', e);
    }

    console.log('\n================================================');
    console.log('        ✅ TS Seeding completed successfully!');
    console.log('================================================\n');
}

main()
    .catch((error) => {
        console.error('\n❌ Seeding orchestrator failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
