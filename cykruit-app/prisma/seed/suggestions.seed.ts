import { PrismaClient } from '@prisma/client';

const ROLE_SUGGESTIONS = [
    'Penetration Tester', 'Red Team Operator', 'Security Engineer', 'SOC Analyst',
    'Threat Intelligence Analyst', 'Cloud Security Engineer', 'Application Security Engineer',
    'Detection Engineer', 'Incident Responder', 'Malware Analyst', 'Reverse Engineer',
    'DevSecOps Engineer', 'IAM Engineer', 'GRC Analyst', 'Security Architect',
    'Vulnerability Researcher', 'Bug Bounty Hunter', 'DFIR Analyst', 'CISO',
    'Security Consultant', 'Mobile Security Engineer', 'API Security Engineer',
];

const SKILL_SUGGESTIONS = [
    'Burp Suite', 'Metasploit', 'Nmap', 'Wireshark', 'Splunk', 'CrowdStrike',
    'AWS Security', 'Azure Security', 'Kubernetes Security', 'Docker Security',
    'OSCP', 'CEH', 'CISSP', 'CISM', 'AWS Security Specialty',
    'Python', 'Bash', 'PowerShell', 'Go', 'Rust',
    'SIEM', 'EDR', 'SOAR', 'WAF', 'IDS/IPS',
    'Threat Modeling', 'Penetration Testing', 'Reverse Engineering', 'Malware Analysis',
    'Zero Trust', 'OWASP', 'CVE Research', 'Exploit Development',
];

const COMPANY_SUGGESTIONS = [
    'Rivedix Technology Solutions', 'RKavach', 'CrowdStrike', 'Palo Alto Networks',
    'Razorpay', 'Zepto', 'Paytm', 'OffSec',
];

export async function seedSuggestions(prisma: PrismaClient): Promise<void> {
    console.log('🌱 Seeding search suggestions...');

    const admin = await prisma.admin.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
    if (!admin) {
        console.warn('⚠️  No admin found — skipping suggestions seed (run after admin creation)');
        return;
    }

    let count = 0;

    const allItems: { text: string; type: 'ROLE' | 'SKILL' | 'COMPANY' }[] = [
        ...ROLE_SUGGESTIONS.map(text => ({ text, type: 'ROLE' as const })),
        ...SKILL_SUGGESTIONS.map(text => ({ text, type: 'SKILL' as const })),
        ...COMPANY_SUGGESTIONS.map(text => ({ text, type: 'COMPANY' as const })),
    ];

    for (const item of allItems) {
        const existing = await prisma.searchSuggestion.findFirst({
            where: { text: item.text, type: item.type },
            select: { id: true },
        });
        if (!existing) {
            await prisma.searchSuggestion.create({
                data: { text: item.text, type: item.type, isActive: true, createdBy: admin.id },
            });
            count++;
        }
    }

    console.log(`✅ Seeded ${count} search suggestions`);
}
