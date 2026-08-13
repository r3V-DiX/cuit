import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const LEGACY_DB_FILE = join(__dirname, '..', 'output', 'legacy-db.json');

function str(row: Record<string, unknown>, col: string): string | null {
    const v = row[col];
    return typeof v === 'string' ? v : null;
}

function iso(row: Record<string, unknown>, col: string): string | null {
    const v = str(row, col);
    if (v === null) return null;
    return v.includes('T') ? v : `${v.replace(' ', 'T')}Z`;
}

function mapAccountStatus(value: string): string {
    if (value === 'DEACTIVATED') return 'INACTIVE';
    return value;
}

async function runLiteSeed() {
    console.log('\n=== LITE SEED (seekers only, email+name+phone) ===\n');

    if (!existsSync(LEGACY_DB_FILE)) {
        throw new Error(`Legacy DB not found at ${LEGACY_DB_FILE}. Generate it first from the pg_dump.`);
    }

    const db = JSON.parse(readFileSync(LEGACY_DB_FILE, 'utf-8'));
    const users = db.users ?? [];
    if (!users.length) {
        throw new Error('No users table in legacy DB');
    }

    const seekerUsers = users.filter((u: Record<string, unknown>) => u.role === 'SEEKER');
    const employerUsers = users.filter((u: Record<string, unknown>) => u.role === 'EMPLOYER');
    console.log(`Legacy users: ${users.length} total (SEEKER: ${seekerUsers.length}, EMPLOYER: ${employerUsers.length})`);

    const userPayloads = seekerUsers.map((u: Record<string, unknown>) => {
        const email = str(u, 'email');
        const firstName = str(u, 'firstName') ?? '';
        const lastName = str(u, 'lastName') ?? '';
        const phone = str(u, 'phone');
        const emailVerifiedAt = iso(u, 'emailVerifiedAt');
        const isEmailVerified = emailVerifiedAt !== null;
        const status = mapAccountStatus(str(u, 'status') ?? 'PENDING');

        return {
            id: str(u, 'id')!,
            email,
            password: null, // V2 is OTP-only
            firstName,
            lastName,
            phone,
            role: 'SEEKER' as const,
            profileImage: null,
            isEmailVerified,
            emailVerifiedAt,
            status,
        };
    });

    console.log(`Prepared ${userPayloads.length} seeker user rows for insert\n`);

    const prisma = new PrismaClient();
    try {
        const { count } = await prisma.user.createMany({
            data: userPayloads,
            skipDuplicates: true,
        });
        console.log(`User: created ${count} (payload ${userPayloads.length})`);

        const actual = await prisma.user.count({ where: { role: 'SEEKER' } });
        console.log(`DB now has ${actual} seeker users\n`);
    } finally {
        await prisma.$disconnect();
    }
}

runLiteSeed().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});