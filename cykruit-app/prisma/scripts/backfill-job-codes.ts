import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateCompanyShortform(companyName: string): string {
  if (!companyName || typeof companyName !== 'string') {
    return 'CYK';
  }

  const cleaned = companyName.trim().replace(/[^a-zA-Z0-9]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const initials = words.map((w) => w[0].toUpperCase()).join('');
    return initials.slice(0, 5);
  } else if (words.length === 1) {
    const single = words[0].toUpperCase();
    if (single.length >= 3) {
      return single.slice(0, 3);
    }
    return single || 'CYK';
  }

  return 'CYK';
}

async function backfill() {
  console.log('🚀 Starting Job Code & Company Shortform Backfill...');

  const employers = await prisma.employer.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      jobs: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log(`📋 Found ${employers.length} employers to process.`);

  const assignedPrefixes = new Set<string>();

  // Collect any already assigned prefixes
  for (const emp of employers) {
    if (emp.jobCodePrefix) {
      assignedPrefixes.add(emp.jobCodePrefix);
    }
  }

  let updatedJobsCount = 0;
  let updatedEmployersCount = 0;

  for (const emp of employers) {
    let prefix = emp.jobCodePrefix;

    if (!prefix) {
      const base = generateCompanyShortform(emp.companyName);
      let candidate = base;
      let counter = 1;

      while (assignedPrefixes.has(candidate)) {
        candidate = `${base}${counter}`;
        counter++;
      }

      prefix = candidate;
      assignedPrefixes.add(prefix);
    }

    console.log(`\n🏢 Employer: "${emp.companyName}" -> Prefix: "${prefix}" (${emp.jobs.length} jobs)`);

    // Backfill jobs sequentially
    let seq = 1;
    for (const job of emp.jobs) {
      const newJobCode = `${prefix}-${String(seq).padStart(4, '0')}`;
      if (job.jobCode !== newJobCode) {
        await prisma.job.update({
          where: { id: job.id },
          data: { jobCode: newJobCode },
        });
        console.log(`   ↳ Updated Job [${job.id}]: ${job.jobCode} -> ${newJobCode}`);
        updatedJobsCount++;
      }
      seq++;
    }

    const nextJobCodeNumber = seq;
    await prisma.employer.update({
      where: { id: emp.id },
      data: {
        jobCodePrefix: prefix,
        nextJobCodeNumber,
      },
    });
    updatedEmployersCount++;
  }

  console.log('\n========================================');
  console.log('✅ Backfill completed successfully!');
  console.log(`   Updated ${updatedEmployersCount} employers.`);
  console.log(`   Updated ${updatedJobsCount} jobs.`);
  console.log('========================================\n');
}

backfill()
  .catch((err) => {
    console.error('❌ Error during backfill:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
