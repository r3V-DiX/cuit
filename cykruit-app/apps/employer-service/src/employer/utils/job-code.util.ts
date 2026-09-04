/**
 * Generates a shortform prefix from a company name:
 * - Multi-word: Uppercase initials (e.g. "Red Ventures" -> "RV", "Amazon Web Services" -> "AWS")
 * - Single-word: First 2-3 uppercase letters (e.g. "Google" -> "GOO", "HP" -> "HP")
 */
export function generateCompanyShortform(companyName: string): string {
    if (!companyName || typeof companyName !== 'string') {
        return 'CYK';
    }

    // Replace non-alphanumeric characters with space so symbols (e.g. &, /, -) separate words cleanly
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

/**
 * Formats a company prefix and sequence number into a job code (e.g. RV-0001)
 */
export function formatJobCode(prefix: string, sequenceNumber: number): string {
    const cleanPrefix = (prefix || 'CYK').trim().toUpperCase();
    const paddedNumber = String(Math.max(1, sequenceNumber)).padStart(4, '0');
    return `${cleanPrefix}-${paddedNumber}`;
}

/**
 * Resolves a unique prefix for an employer, disambiguating if already taken by another employer.
 */
export async function resolveUniqueCompanyPrefix(
    prismaClient: any,
    employerId: string,
    companyName: string,
): Promise<string> {
    const baseCandidate = generateCompanyShortform(companyName);
    let candidate = baseCandidate;
    let counter = 1;

    while (true) {
        const existing = await prismaClient.employer.findUnique({
            where: { jobCodePrefix: candidate },
            select: { id: true },
        });

        if (!existing || existing.id === employerId) {
            return candidate;
        }

        candidate = `${baseCandidate}${counter}`;
        counter++;
    }
}
