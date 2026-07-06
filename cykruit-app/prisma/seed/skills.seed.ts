import { PrismaClient } from '@prisma/client';

export async function seedSkills(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding skill categories and skills...');

    // Load data
    const { skillCategories } = require('../data/skill-categories.data');
    const { skills } = require('../data/skills.data');

    // 1. Seed categories
    let categoriesCount = 0;
    for (const cat of skillCategories) {
        try {
            await prisma.skillCategory.upsert({
                where: { name: cat.name },
                update: { description: cat.description },
                create: {
                    name: cat.name,
                    description: cat.description,
                },
            });
            categoriesCount++;
        } catch (error) {
            console.error(`❌ Failed to upsert skill category: ${cat.name}`, error);
        }
    }
    console.log(`   Seeded ${categoriesCount} skill categories`);

    // Build map of category name -> id
    const dbCategories = await prisma.skillCategory.findMany();
    const categoryMap = new Map<string, string>();
    for (const dbCat of dbCategories) {
        categoryMap.set(dbCat.name, dbCat.id);
    }

    // 2. Seed skills
    let skillsCount = 0;
    for (const skill of skills) {
        const categoryId = categoryMap.get(skill.categoryName);
        if (!categoryId) {
            console.warn(`   ⚠️ Category not found for skill "${skill.name}": "${skill.categoryName}" — skipping`);
            continue;
        }

        try {
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
            skillsCount++;
        } catch (error) {
            console.error(`❌ Failed to upsert skill: ${skill.name}`, error);
        }
    }

    console.log(`✅ Seeded ${skillsCount} skills`);
}
