import { PrismaClient } from '@prisma/client';

const TESTIMONIALS = [
  {
    type: 'SEEKER',
    name: 'Arjun Mehta',
    role: 'Senior Red Team Operator',
    company: 'OffSec',
    avatar: 'AM',
    avatarColor: 'bg-blue-600',
    quote: 'Cykruit understood what I actually do. I highlighted my HTB Pro Hacker rank and CRTO cert — the match quality was miles better than LinkedIn.',
    stars: 5,
    tag: 'RED_TEAM',
    isPublished: true,
    sortOrder: 1,
  },
  {
    type: 'SEEKER',
    name: 'Priya Nair',
    role: 'Cloud Security Engineer',
    company: 'Razorpay',
    avatar: 'PN',
    avatarColor: 'bg-cyan-600',
    quote: 'Three interviews in two weeks after setting up my profile. The AI matching actually understood the difference between generic DevOps and cloud security.',
    stars: 5,
    tag: 'CLOUD_SEC',
    isPublished: true,
    sortOrder: 2,
  },
  {
    type: 'SEEKER',
    name: 'Rahul Singh',
    role: 'SOC Lead',
    company: 'Paytm',
    avatar: 'RS',
    avatarColor: 'bg-purple-600',
    quote: 'Applied to 6 jobs in under 10 minutes. The one-click apply using my profile is a game changer — no more filling the same form 50 times.',
    stars: 5,
    tag: 'SOC_OPS',
    isPublished: true,
    sortOrder: 3,
  },
  {
    type: 'SEEKER',
    name: 'Kavya Reddy',
    role: 'AppSec Engineer',
    company: 'Zepto',
    avatar: 'KR',
    avatarColor: 'bg-green-600',
    quote: 'I went from ghosted on other platforms to having real conversations with hiring managers within days. The direct messaging feature is incredible.',
    stars: 5,
    tag: 'APP_SEC',
    isPublished: true,
    sortOrder: 4,
  },
  {
    type: 'EMPLOYER',
    name: 'Aditya Sharma',
    role: 'CISO',
    company: 'Fintech Startup',
    avatar: 'AS',
    avatarColor: 'bg-blue-600',
    quote: 'We filled a Senior Pentester role in 11 days. On LinkedIn it took us 4 months for the same position last year.',
    stars: 5,
    tag: null,
    isPublished: true,
    sortOrder: 1,
  },
  {
    type: 'EMPLOYER',
    name: 'Rachel Kim',
    role: 'Head of Security Recruiting',
    company: 'Series B SaaS',
    avatar: 'RK',
    avatarColor: 'bg-purple-600',
    quote: 'The AI ranking is legitimately good. It surfaces candidates our team would have found buried on page 6 of applicants.',
    stars: 5,
    tag: null,
    isPublished: true,
    sortOrder: 2,
  },
  {
    type: 'EMPLOYER',
    name: 'Mehul Desai',
    role: 'Security Engineering Manager',
    company: 'E-commerce Platform',
    avatar: 'MD',
    avatarColor: 'bg-green-600',
    quote: 'Every applicant actually understood what our SOC team does. That has never happened before on any other platform.',
    stars: 5,
    tag: null,
    isPublished: true,
    sortOrder: 3,
  },
];

export async function seedTestimonials(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding testimonials...');

  const existing = await prisma.testimonial.count();
  if (existing > 0) {
    console.log(`✅ Testimonials already seeded (${existing} rows) — skipping`);
    return;
  }

  await prisma.testimonial.createMany({ data: TESTIMONIALS });
  console.log(`✅ Seeded ${TESTIMONIALS.length} testimonials`);
}
