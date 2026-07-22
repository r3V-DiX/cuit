// admin-app/prisma/policy-seed.ts
// Idempotent seeder for PolicyConfig defaults (docs/ADMIN_TASKS.md TASK B7).
// Only inserts missing keys — never overwrites a value an admin already changed.
// Run: npm run policies:seed (needs DATABASE_URL)

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { POLICY_DEFAULTS } from '../src/modules/policies/policies.constants';

const prisma = new PrismaClient();

async function main() {
    for (const def of POLICY_DEFAULTS) {
        await prisma.policyConfig.upsert({
            where: { key: def.key },
            create: {
                key: def.key,
                value: def.value,
                type: def.type,
                unit: def.unit,
                description: def.description,
            },
            update: {},
        });
    }

    console.log(`Seeded ${POLICY_DEFAULTS.length} policy config keys.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
