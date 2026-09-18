import { PrismaClient } from '@prisma/client';
import { seedAds } from './ads.seed';

const prisma = new PrismaClient();

async function run() {
  try {
    await seedAds(prisma);
  } catch (err) {
    console.error('❌ Failed to seed ads:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
