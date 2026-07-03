// prisma/data/roles.data.js

const rolesData = [
    // ========================================
    // OFFENSIVE SECURITY ROLES
    // ========================================
    {
        name: 'Penetration Tester',
        category: 'Offensive Security',
        description:
            'Simulates cyber attacks to identify vulnerabilities in systems, networks, and applications',
    },
    {
        name: 'Red Team Operator',
        category: 'Offensive Security',
        description:
            'Conducts advanced adversary simulations to test organizational security defenses',
    },
    {
        name: 'Web Application Security Tester',
        category: 'Offensive Security',
        description:
            'Specializes in identifying vulnerabilities in web applications and APIs',
    },
    {
        name: 'Mobile Security Tester',
        category: 'Offensive Security',
        description:
            'Tests mobile applications (iOS/Android) for security vulnerabilities',
    },
    {
        name: 'Network Penetration Tester',
        category: 'Offensive Security',
        description:
            'Focuses on testing network infrastructure and wireless security',
    },
    {
        name: 'Exploit Developer',
        category: 'Offensive Security',
        description: 'Develops custom exploits for identified vulnerabilities',
    },

    // ========================================
    // DEFENSIVE SECURITY / SOC ROLES
    // ========================================
    {
        name: 'Security Analyst',
        category: 'Defensive Security',
        description:
            'Monitors security events, analyzes threats, and responds to incidents',
    },
    {
        name: 'SOC Analyst (L1)',
        category: 'Defensive Security',
        description:
            'First-line security monitoring, triage, and initial incident response',
    },
    {
        name: 'SOC Analyst (L2)',
        category: 'Defensive Security',
        description:
            'Advanced threat analysis, investigation, and incident handling',
    },
    {
        name: 'SOC Analyst (L3)',
        category: 'Defensive Security',
        description:
            'Expert-level threat hunting, forensics, and complex incident response',
    },
    {
        name: 'Threat Hunter',
        category: 'Defensive Security',
        description:
            'Proactively searches for advanced threats and signs of compromise',
    },
    {
        name: 'Incident Responder',
        category: 'Defensive Security',
        description: 'Handles security incidents and coordinates response efforts',
    },
    {
        name: 'Digital Forensics Analyst',
        category: 'Defensive Security',
        description:
            'Investigates cyber crimes and collects digital evidence',
    },
    {
        name: 'Malware Analyst',
        category: 'Defensive Security',
        description:
            'Analyzes malicious software to understand attack techniques',
    },
    {
        name: 'Security Operations Center Manager',
        category: 'Defensive Security',
        description: 'Manages SOC team and security operations',
    },

    // ========================================
    // CLOUD SECURITY ROLES
    // ========================================
    {
        name: 'Cloud Security Engineer',
        category: 'Cloud Security',
        description:
            'Secures cloud infrastructure across AWS, Azure, GCP',
    },
    {
        name: 'Cloud Security Architect',
        category: 'Cloud Security',
        description:
            'Designs secure cloud architectures and security frameworks',
    },
    {
        name: 'AWS Security Engineer',
        category: 'Cloud Security',
        description: 'Specializes in Amazon Web Services security',
    },
    {
        name: 'Azure Security Engineer',
        category: 'Cloud Security',
        description: 'Specializes in Microsoft Azure security',
    },
    {
        name: 'GCP Security Engineer',
        category: 'Cloud Security',
        description: 'Specializes in Google Cloud Platform security',
    },
    {
        name: 'DevSecOps Engineer',
        category: 'Cloud Security',
        description:
            'Integrates security into CI/CD pipelines and DevOps practices',
    },

    // ========================================
    // APPLICATION SECURITY ROLES
    // ========================================
    {
        name: 'Application Security Engineer',
        category: 'Application Security',
        description:
            'Secures applications throughout the development lifecycle',
    },
    {
        name: 'Secure Code Reviewer',
        category: 'Application Security',
        description: 'Reviews source code for security vulnerabilities',
    },
    {
        name: 'API Security Engineer',
        category: 'Application Security',
        description: 'Secures REST/GraphQL APIs and microservices',
    },
    {
        name: 'Security Champion',
        category: 'Application Security',
        description: 'Promotes security practices within development teams',
    },

    // ========================================
    // GOVERNANCE, RISK & COMPLIANCE ROLES
    // ========================================
    {
        name: 'Security Compliance Analyst',
        category: 'Governance, Risk & Compliance',
        description:
            'Ensures compliance with security standards and regulations',
    },
    {
        name: 'Risk Analyst',
        category: 'Governance, Risk & Compliance',
        description: 'Identifies and assesses cybersecurity risks',
    },
    {
        name: 'Security Auditor',
        category: 'Governance, Risk & Compliance',
        description: 'Conducts security audits and compliance assessments',
    },
    {
        name: 'GRC Consultant',
        category: 'Governance, Risk & Compliance',
        description:
            'Provides governance, risk, and compliance advisory services',
    },
    {
        name: 'Cyber Risk Manager',
        category: 'Governance, Risk & Compliance',
        description: 'Manages organizational cybersecurity risk',
    },

    // ========================================
    // SECURITY ARCHITECTURE & ENGINEERING
    // ========================================
    {
        name: 'Security Architect',
        category: 'Security Architecture',
        description: 'Designs enterprise security architectures',
    },
    {
        name: 'Security Engineer',
        category: 'Security Engineering',
        description:
            'Implements and maintains security systems and controls',
    },
    {
        name: 'Network Security Engineer',
        category: 'Security Engineering',
        description:
            'Secures network infrastructure, firewalls, and VPNs',
    },
    {
        name: 'Endpoint Security Engineer',
        category: 'Security Engineering',
        description: 'Secures end-user devices and endpoints',
    },
    {
        name: 'Identity and Access Management Engineer',
        category: 'Security Engineering',
        description: 'Manages IAM solutions and access controls',
    },

    // ========================================
    // THREAT INTELLIGENCE & RESEARCH
    // ========================================
    {
        name: 'Threat Intelligence Analyst',
        category: 'Threat Intelligence',
        description:
            'Analyzes threat data and provides actionable intelligence',
    },
    {
        name: 'Cyber Threat Researcher',
        category: 'Threat Intelligence',
        description: 'Researches emerging threats and attack techniques',
    },
    {
        name: 'Security Researcher',
        category: 'Research',
        description:
            'Conducts research on vulnerabilities and security technologies',
    },

    // ========================================
    // LEADERSHIP & MANAGEMENT ROLES
    // ========================================
    {
        name: 'Chief Information Security Officer (CISO)',
        category: 'Leadership',
        description: 'Leads organizational security strategy and programs',
    },
    {
        name: 'Security Manager',
        category: 'Management',
        description: 'Manages security teams and operations',
    },
    {
        name: 'Security Team Lead',
        category: 'Management',
        description: 'Leads security teams and projects',
    },

    // ========================================
    // SPECIALIZED ROLES
    // ========================================
    {
        name: 'Bug Bounty Hunter',
        category: 'Specialized',
        description:
            'Identifies vulnerabilities through bug bounty programs',
    },
    {
        name: 'Security Consultant',
        category: 'Consulting',
        description: 'Provides expert security advisory services',
    },
    {
        name: 'Cryptography Engineer',
        category: 'Specialized',
        description: 'Designs and implements cryptographic solutions',
    },
    {
        name: 'IoT Security Engineer',
        category: 'Specialized',
        description: 'Secures Internet of Things devices and systems',
    },
    {
        name: 'OT/ICS Security Engineer',
        category: 'Specialized',
        description:
            'Secures Operational Technology and Industrial Control Systems',
    },
    {
        name: 'Security Trainer',
        category: 'Training & Awareness',
        description: 'Trains staff on security best practices',
    },

    // ========================================
    // NEW TRAINER ROLES
    // ========================================
    {
        name: 'Data Privacy Trainer',
        category: 'Training & Awareness',
        description:
            'Delivers training on data privacy regulations including GDPR, DPDP, and CCPA',
    },
    {
        name: 'ISO 42001 Lead Implementor and Auditor Trainer',
        category: 'Training & Awareness',
        description:
            'Trains professionals on AI Management Systems implementation and auditing',
    },
    {
        name: 'OT Security Trainer',
        category: 'Training & Awareness',
        description:
            'Delivers training on operational technology and industrial control systems security',
    },
    {
        name: 'Web and Application Security Trainer',
        category: 'Training & Awareness',
        description:
            'Trains professionals on VAPT, web application security, and penetration testing',
    },
    {
        name: 'Automotive Security Trainer',
        category: 'Training & Awareness',
        description:
            'Delivers training on automotive cybersecurity standards like ISO 21434 and TISAX',
    },
    {
        name: 'CISSP Trainer',
        category: 'Training & Awareness',
        description:
            'Prepares candidates for CISSP certification covering all 8 security domains',
    },
    {
        name: 'AIGP Trainer',
        category: 'Training & Awareness',
        description:
            'Trains professionals on AI governance and privacy principles',
    },
    {
        name: 'Corporate Security Trainer',
        category: 'Training & Awareness',
        description:
            'Delivers comprehensive corporate security training programs',
    },
];

module.exports = rolesData;