import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const employer = await prisma.employer.findFirst();
  if (!employer) { console.error("No employer found"); process.exit(1); }

  const job = await prisma.job.create({
    data: {
      employerId: employer.id,
      jobTitle: "Security Engineer (Test - Screening Flow)",
      slug: `security-engineer-screening-${Date.now()}`,
      experienceLevel: "MID",
      jobType: "FULL_TIME",
      workMode: "REMOTE",
      description: "This is a test job to verify the screening questions application flow. Apply and answer the screening questions below.",
      status: "APPROVED",
      applicationType: "SCREENING",
      screeningQuestions: [
        {
          id: randomUUID(),
          question: "How many years of experience do you have in information security?",
          required: true,
          type: "SINGLE_CHOICE",
          options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"]
        },
        {
          id: randomUUID(),
          question: "Which of the following security certifications do you hold? (Select all that apply)",
          required: false,
          type: "MULTIPLE_CHOICE",
          options: ["CEH", "OSCP", "CISSP", "CompTIA Security+", "None"]
        },
        {
          id: randomUUID(),
          question: "Are you legally authorised to work in the country where this role is based?",
          required: true,
          type: "SINGLE_CHOICE",
          options: ["Yes", "No", "Will require sponsorship"]
        },
        {
          id: randomUUID(),
          question: "Briefly describe your most impactful security project or finding.",
          required: true,
          type: "SHORT_ANSWER"
        }
      ],
      publishedAt: new Date(),
    } as any
  });

  console.log(`Created job: ${job.jobTitle}`);
  console.log(`Job ID: ${job.id}`);
  console.log(`Slug: ${job.slug}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
