// prisma/data/skills.data.js

// NOTE: categoryName must match exactly with skill-categories.data.js names
const skills = [
    // ── Offensive Security ──────────────────────────────────────
    {
        name: 'Penetration Testing',
        categoryName: 'Offensive Security',
        description: 'Simulating real-world attacks to identify security vulnerabilities in systems',
    },
    {
        name: 'Exploitation Development',
        categoryName: 'Offensive Security',
        description: 'Writing and customizing exploits to take advantage of software vulnerabilities',
    },
    {
        name: 'Red Team Operations',
        categoryName: 'Offensive Security',
        description: 'Conducting advanced adversary simulations to test organizational defenses',
    },
    {
        name: 'Social Engineering',
        categoryName: 'Offensive Security',
        description: 'Manipulating individuals to gain unauthorized access to systems or information',
    },
    {
        name: 'Privilege Escalation',
        categoryName: 'Offensive Security',
        description: 'Techniques to gain higher-level permissions on a compromised system',
    },

    // ── Defensive Security ──────────────────────────────────────
    {
        name: 'Threat Hunting',
        categoryName: 'Defensive Security',
        description: 'Proactively searching for threats and attackers lurking in the environment',
    },
    {
        name: 'SIEM Management',
        categoryName: 'Defensive Security',
        description: 'Configuring and managing Security Information and Event Management systems',
    },
    {
        name: 'Incident Response',
        categoryName: 'Defensive Security',
        description: 'Detecting, containing, and recovering from cybersecurity incidents',
    },
    {
        name: 'Vulnerability Management',
        categoryName: 'Defensive Security',
        description: 'Identifying, classifying, and remediating security vulnerabilities',
    },
    {
        name: 'Endpoint Detection & Response (EDR)',
        categoryName: 'Defensive Security',
        description: 'Monitoring and responding to threats on endpoint devices',
    },

    // ── Network Security ────────────────────────────────────────
    {
        name: 'Network Traffic Analysis',
        categoryName: 'Network Security',
        description: 'Capturing and analyzing network packets to detect anomalies and threats',
    },
    {
        name: 'Firewall Configuration',
        categoryName: 'Network Security',
        description: 'Setting up and managing firewalls to control network access',
    },
    {
        name: 'Intrusion Detection & Prevention (IDS/IPS)',
        categoryName: 'Network Security',
        description: 'Deploying and tuning IDS/IPS systems to detect and block malicious traffic',
    },
    {
        name: 'VPN & Zero Trust Architecture',
        categoryName: 'Network Security',
        description: 'Implementing secure remote access and zero trust network models',
    },

    // ── Web Security ────────────────────────────────────────────
    {
        name: 'Web Application Penetration Testing',
        categoryName: 'Web Security',
        description: 'Testing web applications for vulnerabilities like XSS, SQLi, CSRF, and IDOR',
    },
    {
        name: 'API Security Testing',
        categoryName: 'Web Security',
        description: 'Identifying security flaws in REST and GraphQL APIs',
    },
    {
        name: 'Burp Suite',
        categoryName: 'Web Security',
        description: 'Using Burp Suite for intercepting, scanning, and exploiting web vulnerabilities',
    },
    {
        name: 'OWASP Top 10',
        categoryName: 'Web Security',
        description: 'Knowledge and mitigation of the OWASP Top 10 web application security risks',
    },

    // ── Cloud Security ──────────────────────────────────────────
    {
        name: 'AWS Security',
        categoryName: 'Cloud Security',
        description: 'Securing AWS infrastructure including IAM, S3, VPC, and CloudTrail',
    },
    {
        name: 'Azure Security',
        categoryName: 'Cloud Security',
        description: 'Securing Microsoft Azure environments including Defender and Sentinel',
    },
    {
        name: 'Cloud Penetration Testing',
        categoryName: 'Cloud Security',
        description: 'Testing cloud environments for misconfigurations and vulnerabilities',
    },
    {
        name: 'Container Security (Docker/Kubernetes)',
        categoryName: 'Cloud Security',
        description: 'Securing containerized workloads and Kubernetes clusters',
    },

    // ── Malware Analysis & Reverse Engineering ──────────────────
    {
        name: 'Static Malware Analysis',
        categoryName: 'Malware Analysis & Reverse Engineering',
        description: 'Analyzing malware without executing it using tools like IDA Pro and Ghidra',
    },
    {
        name: 'Dynamic Malware Analysis',
        categoryName: 'Malware Analysis & Reverse Engineering',
        description: 'Executing malware in a sandbox to observe its behavior',
    },
    {
        name: 'Reverse Engineering',
        categoryName: 'Malware Analysis & Reverse Engineering',
        description: 'Decompiling and analyzing binaries to understand their functionality',
    },
    {
        name: 'Ghidra',
        categoryName: 'Malware Analysis & Reverse Engineering',
        description: 'Using the NSA\'s Ghidra framework for reverse engineering binaries',
    },

    // ── Digital Forensics & Incident Response ──────────────────
    {
        name: 'Disk & Memory Forensics',
        categoryName: 'Digital Forensics & Incident Response',
        description: 'Acquiring and analyzing disk images and memory dumps for evidence',
    },
    {
        name: 'Log Analysis',
        categoryName: 'Digital Forensics & Incident Response',
        description: 'Parsing and correlating system and application logs to reconstruct events',
    },
    {
        name: 'Chain of Custody',
        categoryName: 'Digital Forensics & Incident Response',
        description: 'Maintaining proper documentation and handling of digital evidence',
    },

    // ── Cryptography ────────────────────────────────────────────
    {
        name: 'Public Key Infrastructure (PKI)',
        categoryName: 'Cryptography',
        description: 'Designing and managing PKI systems for digital certificates',
    },
    {
        name: 'Cryptographic Protocol Analysis',
        categoryName: 'Cryptography',
        description: 'Analyzing and breaking weak cryptographic implementations',
    },

    // ── Programming & Scripting ─────────────────────────────────
    {
        name: 'Python',
        categoryName: 'Programming & Scripting',
        description: 'Using Python for scripting, automation, and security tool development',
    },
    {
        name: 'Bash Scripting',
        categoryName: 'Programming & Scripting',
        description: 'Writing Bash scripts for automation and post-exploitation tasks',
    },
    {
        name: 'PowerShell',
        categoryName: 'Programming & Scripting',
        description: 'Using PowerShell for Windows administration and offensive operations',
    },
    {
        name: 'C / C++',
        categoryName: 'Programming & Scripting',
        description: 'Low-level programming for exploit development and tool creation',
    },

    // ── Governance, Risk & Compliance ──────────────────────────
    {
        name: 'ISO 27001',
        categoryName: 'Governance, Risk & Compliance',
        description: 'Implementing and auditing ISO 27001 information security management systems',
    },
    {
        name: 'Risk Assessment',
        categoryName: 'Governance, Risk & Compliance',
        description: 'Identifying and evaluating cybersecurity risks to an organization',
    },
    {
        name: 'Security Awareness Training',
        categoryName: 'Governance, Risk & Compliance',
        description: 'Designing and delivering security awareness programs for employees',
    },
];

module.exports = { skills };