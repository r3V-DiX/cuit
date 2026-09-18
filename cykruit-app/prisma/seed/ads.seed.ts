import { PrismaClient } from '@prisma/client';

export async function seedAds(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Partner Spotlight Ads & Events...');

  const sampleAds = [
    {
      slotKey: 'landing-hero-strip',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
      linkUrl: 'https://www.blackhat.com',
      altText: 'Global Cyber Summit 2026 — Keynote Workshops & Live Hacking Demos',
      isActive: true,
    },
    {
      slotKey: 'landing-hero-strip',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
      linkUrl: 'https://www.defcon.org',
      altText: 'National CTF Cyber Defense Arena & Live Penetration Testing Tournament',
      isActive: true,
    },
    {
      slotKey: 'landing-hero-strip',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
      linkUrl: 'https://www.zscaler.com',
      altText: 'Zscaler Zero Trust Cloud Security Architecture Showcase',
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

  for (const adData of sampleAds) {
    const existing = await prisma.ad.findFirst({
      where: { slotKey: adData.slotKey, altText: adData.altText },
    });

    if (!existing) {
      await prisma.ad.create({ data: adData });
    }
  }

  console.log(`✅ Seeded ${sampleAds.length} Partner Spotlight Ads & Events`);
}
