import { PrismaClient } from '@prisma/client';

export async function seedAds(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Flagship Sep/Oct 2026 Cybersecurity Events...');

  // Clear existing landing-hero-strip entries so exactly 2 events remain for the landing spotlight
  await prisma.ad.deleteMany({
    where: { slotKey: 'landing-hero-strip' },
  });

  const flagshipEvents = [
    {
      slotKey: 'landing-hero-strip',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
      linkUrl: 'https://www.infosecworldusa.com',
      altText: 'InfoSec World 2026 (Sept 28 - Oct 1, 2026) — 4,000+ CISOs, Live Hacking Labs & Threat Summits',
      isActive: true,
    },
    {
      slotKey: 'landing-hero-strip',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
      linkUrl: 'https://www.blackhat.com',
      altText: 'Black Hat Europe 2026 (Oct 26 - 29, 2026) — Elite Zero-Day Exploitation & Cyber Defense Summit',
      isActive: true,
    },
    {
      slotKey: 'jobs-grid',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
      linkUrl: 'https://www.sans.org',
      altText: 'SANS Institute GIAC Global Cybersecurity Certifications',
      isActive: true,
    },
    {
      slotKey: 'whats-new-banner',
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200&auto=format&fit=crop',
      linkUrl: 'https://www.rsaconference.com',
      altText: 'RSA Cyber Conference 2026 — AI Threat Vectors & SOC Operations',
      isActive: true,
    },
  ];

  for (const adData of flagshipEvents) {
    await prisma.ad.create({ data: adData });
  }

  console.log(`✅ Seeded ${flagshipEvents.length} Partner Spotlight Ads (Exactly 2 Flagship Sep/Oct 2026 Events on Landing Page)`);
}
