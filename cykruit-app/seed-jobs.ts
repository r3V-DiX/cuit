import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedJobs() {
  console.log("Seeding jobs...");
  
  // Find employer
  const employer = await prisma.employer.findFirst();
  if (!employer) {
    console.log("No employer found! Cannot seed jobs.");
    return;
  }

  // Delete existing jobs first
  await prisma.job.deleteMany({});
  
  const jobs = [
    {
      employerId: employer.id,
      jobTitle: "Senior Frontend Engineer",
      slug: "senior-frontend-engineer-1",
      experienceLevel: "SENIOR",
      jobType: "FULL_TIME",
      workMode: "REMOTE",
      description: "We are looking for an experienced Frontend Engineer with Next.js expertise.",
      status: "APPROVED",
      applicationType: "DIRECT"
    },
    {
      employerId: employer.id,
      jobTitle: "Cybersecurity Analyst",
      slug: "cybersecurity-analyst-1",
      experienceLevel: "MID",
      jobType: "FULL_TIME",
      workMode: "HYBRID",
      description: "Join our security team to analyze and prevent cyber threats.",
      status: "APPROVED",
      applicationType: "DIRECT"
    },
    {
      employerId: employer.id,
      jobTitle: "DevOps Engineer",
      slug: "devops-engineer-1",
      experienceLevel: "SENIOR",
      jobType: "CONTRACT",
      workMode: "REMOTE",
      description: "Looking for a DevOps engineer to manage our AWS infrastructure.",
      status: "APPROVED",
      applicationType: "DIRECT"
    }
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: job as any });
  }

  console.log("Seeded 3 jobs successfully!");
}

seedJobs()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
