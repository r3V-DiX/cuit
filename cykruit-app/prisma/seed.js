// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const { skillCategories } = require('./data/skill-categories.data');
const { skills } = require('./data/skills.data');
const { certifications } = require('./data/certifications.data');
const { institutes } = require('./data/institutes.data');
const { locations } = require('./data/locations.data');
const { admins } = require('./data/admin.data');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
    console.log(`\n🌱 ${msg}`);
}

function success(msg) {
    console.log(`   ✅ ${msg}`);
}

function info(msg) {
    console.log(`   ℹ️  ${msg}`);
}

// ─── Seeders ──────────────────────────────────────────────────────────────────

async function seedSkillCategories() {
    log('Seeding skill categories...');

    let created = 0;
    let updated = 0;

    for (const category of skillCategories) {
        const result = await prisma.skillCategory.upsert({
            where: { name: category.name },
            update: { description: category.description },
            create: {
                name: category.name,
                description: category.description,
            },
        });

        if (result) {
            created++;
        }
    }

    success(`Skill categories seeded: ${skillCategories.length} records`);
}

async function seedSkills() {
    log('Seeding skills...');

    // Build a map of categoryName -> categoryId for quick lookup
    const categoryMap = {};
    const allCategories = await prisma.skillCategory.findMany();
    for (const cat of allCategories) {
        categoryMap[cat.name] = cat.id;
    }

    let seeded = 0;
    let skipped = 0;

    for (const skill of skills) {
        const categoryId = categoryMap[skill.categoryName];

        if (!categoryId) {
            console.warn(`   ⚠️  Category not found for skill "${skill.name}": "${skill.categoryName}" — skipping`);
            skipped++;
            continue;
        }

        await prisma.skill.upsert({
            where: { name: skill.name },
            update: {
                description: skill.description,
                categoryId,
                isVerified: true,
            },
            create: {
                name: skill.name,
                description: skill.description,
                categoryId,
                isVerified: true,
            },
        });

        seeded++;
    }

    success(`Skills seeded: ${seeded} records${skipped ? `, ${skipped} skipped` : ''}`);
}

async function seedCertifications() {
    log('Seeding certifications...');

    for (const cert of certifications) {
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
    }

    success(`Certifications seeded: ${certifications.length} records`);
}

async function seedInstitutes() {
    log('Seeding institutes...');

    for (const institute of institutes) {
        await prisma.institute.upsert({
            where: { name: institute.name },
            update: {
                city: institute.city,
                state: institute.state,
                country: institute.country,
                isVerified: true,
            },
            create: {
                name: institute.name,
                city: institute.city,
                state: institute.state,
                country: institute.country,
                isVerified: true,
            },
        });
    }

    success(`Institutes seeded: ${institutes.length} records`);
}

async function seedLocations() {
    log('Seeding locations...');

    for (const location of locations) {
        await prisma.location.upsert({
            where: {
                city_state_country: {
                    city: location.city,
                    state: location.state,
                    country: location.country,
                },
            },
            update: {
                displayName: location.displayName,
                searchText: location.searchText,
                isPopular: location.isPopular,
            },
            create: {
                city: location.city,
                state: location.state,
                country: location.country,
                displayName: location.displayName,
                searchText: location.searchText,
                isPopular: location.isPopular,
            },
        });
    }

    success(`Locations seeded: ${locations.length} records`);
}

async function seedAdmins() {
    log('Seeding admin users...');

    for (const admin of admins) {
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
    }

    success(`Admins seeded: ${admins.length} records`);
    info('Admin credentials → email: admin@cykruit.com | password: Admin@123');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n================================================');
    console.log('        🚀 Cykruit Database Seeder');
    console.log('================================================');

    await seedSkillCategories();
    await seedSkills();
    await seedCertifications();
    await seedInstitutes();
    await seedLocations();
    await seedAdmins();

    console.log('\n================================================');
    console.log('        ✅ Seeding completed successfully!');
    console.log('================================================\n');
}

main()
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });