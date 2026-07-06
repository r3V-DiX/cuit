import { PrismaClient } from '@prisma/client';

export async function seedLocations(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding locations...');

    // Load locations from the existing data file
    const { locations } = require('../data/locations.data');

    // Add Remote option as specified in requirements
    const remoteLocation = {
        city: 'Remote',
        state: null,
        country: 'Worldwide',
        displayName: 'Remote',
        searchText: 'remote',
        isPopular: true,
    };

    const allLocations = [...locations];
    // Check if Remote is already in the list; if not, add it
    if (!allLocations.some(l => l.city === 'Remote' && l.country === 'Worldwide')) {
        allLocations.push(remoteLocation);
    }

    let count = 0;
    for (const loc of allLocations) {
        try {
            const stateValue = loc.state || null;
            const existing = await prisma.location.findFirst({
                where: {
                    city: loc.city,
                    state: stateValue,
                    country: loc.country,
                },
            });

            if (existing) {
                await prisma.location.update({
                    where: { id: existing.id },
                    data: {
                        displayName: loc.displayName,
                        searchText: loc.searchText.toLowerCase(),
                        isPopular: loc.isPopular,
                    },
                });
            } else {
                await prisma.location.create({
                    data: {
                        city: loc.city,
                        state: stateValue,
                        country: loc.country,
                        displayName: loc.displayName,
                        searchText: loc.searchText.toLowerCase(),
                        isPopular: loc.isPopular,
                    },
                });
            }
            count++;
        } catch (error) {
            console.error(`❌ Failed to upsert location: ${loc.city}, ${loc.country}`, error);
        }
    }

    console.log(`✅ Seeded ${count} locations`);
}
