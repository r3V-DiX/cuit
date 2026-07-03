// prisma/data/certifications.data.js

const certifications = [
    // ── Offensive Security ──────────────────────────────────────
    {
        name: 'OSCP',
        organization: 'Offensive Security',
        description: 'Offensive Security Certified Professional — hands-on penetration testing certification',
    },
    {
        name: 'OSCE3',
        organization: 'Offensive Security',
        description: 'Offensive Security Certified Expert 3 — advanced exploit development and red teaming',
    },
    {
        name: 'OSEP',
        organization: 'Offensive Security',
        description: 'Offensive Security Experienced Penetration Tester — advanced evasion and active directory attacks',
    },
    {
        name: 'OSED',
        organization: 'Offensive Security',
        description: 'Offensive Security Exploit Developer — Windows exploit development',
    },
    {
        name: 'OSWE',
        organization: 'Offensive Security',
        description: 'Offensive Security Web Expert — advanced web application penetration testing',
    },

    // ── EC-Council ──────────────────────────────────────────────
    {
        name: 'CEH',
        organization: 'EC-Council',
        description: 'Certified Ethical Hacker — foundational ethical hacking and penetration testing',
    },
    {
        name: 'CPENT',
        organization: 'EC-Council',
        description: 'Certified Penetration Testing Professional — advanced pentesting across multiple domains',
    },
    {
        name: 'CHFI',
        organization: 'EC-Council',
        description: 'Computer Hacking Forensic Investigator — digital forensics investigation',
    },

    // ── CompTIA ─────────────────────────────────────────────────
    {
        name: 'CompTIA Security+',
        organization: 'CompTIA',
        description: 'Foundational cybersecurity certification covering core security concepts',
    },
    {
        name: 'CompTIA PenTest+',
        organization: 'CompTIA',
        description: 'Penetration testing and vulnerability assessment certification',
    },
    {
        name: 'CompTIA CySA+',
        organization: 'CompTIA',
        description: 'Cybersecurity Analyst — threat detection and security operations',
    },
    {
        name: 'CompTIA CASP+',
        organization: 'CompTIA',
        description: 'Advanced Security Practitioner — enterprise security architecture',
    },

    // ── ISC2 ────────────────────────────────────────────────────
    {
        name: 'CISSP',
        organization: 'ISC2',
        description: 'Certified Information Systems Security Professional — gold standard in cybersecurity',
    },
    {
        name: 'CCSP',
        organization: 'ISC2',
        description: 'Certified Cloud Security Professional — cloud security architecture and operations',
    },
    {
        name: 'CSSLP',
        organization: 'ISC2',
        description: 'Certified Secure Software Lifecycle Professional — secure software development',
    },

    // ── SANS / GIAC ─────────────────────────────────────────────
    {
        name: 'GPEN',
        organization: 'GIAC',
        description: 'GIAC Penetration Tester — network and web penetration testing',
    },
    {
        name: 'GWAPT',
        organization: 'GIAC',
        description: 'GIAC Web Application Penetration Tester — web application security testing',
    },
    {
        name: 'GCIH',
        organization: 'GIAC',
        description: 'GIAC Certified Incident Handler — incident handling and response',
    },
    {
        name: 'GREM',
        organization: 'GIAC',
        description: 'GIAC Reverse Engineering Malware — malware analysis and reverse engineering',
    },
    {
        name: 'GCFE',
        organization: 'GIAC',
        description: 'GIAC Certified Forensic Examiner — Windows forensics and investigations',
    },

    // ── Cloud Security ──────────────────────────────────────────
    {
        name: 'AWS Certified Security – Specialty',
        organization: 'Amazon Web Services',
        description: 'Advanced AWS security concepts including data protection and infrastructure security',
    },
    {
        name: 'Google Professional Cloud Security Engineer',
        organization: 'Google Cloud',
        description: 'Designing and implementing secure workloads on Google Cloud Platform',
    },
    {
        name: 'Microsoft Certified: Security Operations Analyst',
        organization: 'Microsoft',
        description: 'Using Microsoft Sentinel and Defender to detect and respond to threats',
    },

    // ── eLearnSecurity / INE ────────────────────────────────────
    {
        name: 'eJPT',
        organization: 'INE Security',
        description: 'eLearnSecurity Junior Penetration Tester — entry-level penetration testing',
    },
    {
        name: 'eCPPTv2',
        organization: 'INE Security',
        description: 'Certified Professional Penetration Tester — advanced pentesting with report writing',
    },
    {
        name: 'eWPTX',
        organization: 'INE Security',
        description: 'eLearnSecurity Web Application Penetration Tester eXtreme — advanced web security',
    },

    // ── TCM Security ────────────────────────────────────────────
    {
        name: 'PNPT',
        organization: 'TCM Security',
        description: 'Practical Network Penetration Tester — hands-on real-world pentesting exam',
    },
    {
        name: 'PJMR',
        organization: 'TCM Security',
        description: 'Practical Junior Malware Researcher — foundational malware analysis',
    },

    // ── ISACA ───────────────────────────────────────────────────
    {
        name: 'CISM',
        organization: 'ISACA',
        description: 'Certified Information Security Manager — security management and governance',
    },
    {
        name: 'CISA',
        organization: 'ISACA',
        description: 'Certified Information Systems Auditor — IT audit and assurance',
    },
    {
        name: 'CRISC',
        organization: 'ISACA',
        description: 'Certified in Risk and Information Systems Control — IT risk management',
    },
];

module.exports = { certifications };