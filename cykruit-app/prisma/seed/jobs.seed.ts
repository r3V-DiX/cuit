import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const EMPLOYERS = [
  {
    email: 'talent@offsec.com',
    password: 'OffSec@2025!',
    firstName: 'Alex',
    lastName: 'Morgan',
    companyName: 'OffSec',
    slug: 'offsec',
    companyType: 'PRIVATE_LIMITED_COMPANY' as const,
    industry: 'TECHNOLOGY' as const,
    companySize: 'SIZE_201_500' as const,
    location: 'Remote, US',
    companyWebsite: 'https://offsec.com',
    about: 'OffSec is the leading provider of penetration testing training and certifications, including OSCP, OSEP, and OSED.',
  },
  {
    email: 'jobs@crowdstrike-hiring.com',
    password: 'CrowdStrike@2025!',
    firstName: 'Sarah',
    lastName: 'Chen',
    companyName: 'CrowdStrike',
    slug: 'crowdstrike',
    companyType: 'PUBLIC_LIMITED_COMPANY' as const,
    industry: 'TECHNOLOGY' as const,
    companySize: 'SIZE_1000_PLUS' as const,
    location: 'Austin, TX, US',
    companyWebsite: 'https://crowdstrike.com',
    about: 'CrowdStrike is a global cybersecurity leader known for the Falcon platform — AI-native endpoint protection at scale.',
  },
  {
    email: 'careers@razorpay-security.com',
    password: 'Razorpay@2025!',
    firstName: 'Rohan',
    lastName: 'Gupta',
    companyName: 'Razorpay',
    slug: 'razorpay',
    companyType: 'PRIVATE_LIMITED_COMPANY' as const,
    industry: 'FINANCE' as const,
    companySize: 'SIZE_1000_PLUS' as const,
    location: 'Bengaluru, IN',
    companyWebsite: 'https://razorpay.com',
    about: 'Razorpay is India\'s leading full-stack payments solution, trusted by 500K+ businesses.',
  },
  {
    email: 'security@paytm-jobs.com',
    password: 'Paytm@2025!',
    firstName: 'Vikram',
    lastName: 'Singh',
    companyName: 'Paytm',
    slug: 'paytm',
    companyType: 'PUBLIC_LIMITED_COMPANY' as const,
    industry: 'FINANCE' as const,
    companySize: 'SIZE_1000_PLUS' as const,
    location: 'Noida, IN',
    companyWebsite: 'https://paytm.com',
    about: 'Paytm is India\'s largest mobile payments and financial services company.',
  },
  {
    email: 'infosec@zepto-security.com',
    password: 'Zepto@2025!',
    firstName: 'Ananya',
    lastName: 'Sharma',
    companyName: 'Zepto',
    slug: 'zepto',
    companyType: 'PRIVATE_LIMITED_COMPANY' as const,
    industry: 'RETAIL' as const,
    companySize: 'SIZE_501_1000' as const,
    location: 'Mumbai, IN',
    companyWebsite: 'https://zepto.com',
    about: 'Zepto is India\'s fastest growing 10-minute grocery delivery startup, operating at massive scale.',
  },
];

const JOB_TEMPLATES = [
  {
    employerSlug: 'offsec',
    jobTitle: 'Senior Penetration Tester',
    slug: 'senior-penetration-tester-offsec',
    jobType: 'FULL_TIME' as const,
    workMode: 'REMOTE' as const,
    experienceLevel: 'SENIOR' as const,
    applicationType: 'DIRECT' as const,
    description: `We are looking for a Senior Penetration Tester to join our red team operations group. You will conduct advanced offensive security assessments for enterprise clients, develop custom exploitation tooling, and contribute to our world-class training curriculum.

Responsibilities:
- Lead complex penetration testing engagements (network, web, mobile, AD)
- Develop and maintain custom C2 implants and post-exploitation tooling
- Write clear, actionable remediation reports for technical and executive audiences
- Mentor junior pentesters and contribute to internal knowledge base

Requirements:
- OSCP required; OSED, OSEP, or CRTO strongly preferred
- 5+ years hands-on offensive security experience
- Proficiency in Python, C, and PowerShell
- Experience with Cobalt Strike, Havoc C2, or custom tooling
- Deep understanding of Active Directory attack paths`,
    skillNames: ['Penetration Testing', 'Active Directory', 'Python', 'Cobalt Strike'],
    certNames: ['OSCP', 'CRTO'],
  },
  {
    employerSlug: 'crowdstrike',
    jobTitle: 'Threat Intelligence Analyst',
    slug: 'threat-intelligence-analyst-crowdstrike',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `CrowdStrike Intelligence is hiring a Threat Intelligence Analyst to track nation-state and eCrime adversaries. You will produce finished intelligence products and track TTPs across the MITRE ATT&CK framework.

Responsibilities:
- Track and profile advanced persistent threat (APT) groups
- Produce strategic and tactical threat intelligence reports
- Perform malware analysis and reverse engineering of threat actor tooling
- Collaborate with red team and detection engineering

Requirements:
- 3+ years threat intelligence or threat hunting experience
- Proficiency in YARA, Sigma, and MITRE ATT&CK
- Experience with sandbox analysis (Any.run, Cuckoo)
- Strong written communication skills for executive briefings`,
    skillNames: ['Threat Intelligence', 'Malware Analysis', 'MITRE ATT&CK', 'YARA'],
    certNames: ['GCTI', 'GREM'],
  },
  {
    employerSlug: 'razorpay',
    jobTitle: 'Cloud Security Engineer',
    slug: 'cloud-security-engineer-razorpay',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `Razorpay is looking for a Cloud Security Engineer to secure our AWS and GCP infrastructure at scale. You will own cloud security posture management and build security automation pipelines.

Responsibilities:
- Implement and maintain CSPM tooling (Wiz, Prisma Cloud)
- Design IAM policies and enforce least privilege across 200+ AWS accounts
- Build IaC security scanning pipelines (Terraform, CDK)
- Respond to cloud security incidents and conduct forensics
- Own PCI-DSS and SOC2 cloud control evidence

Requirements:
- AWS Security Specialty or GCP Professional Cloud Security Engineer certification
- 3+ years cloud security engineering experience
- Strong Terraform and Python skills
- Experience with container security (EKS, Kubernetes RBAC)`,
    skillNames: ['AWS', 'Cloud Security', 'Terraform', 'Kubernetes'],
    certNames: ['AWS Security Specialty', 'CCSP'],
  },
  {
    employerSlug: 'paytm',
    jobTitle: 'SOC Lead – L3 Analyst',
    slug: 'soc-lead-l3-analyst-paytm',
    jobType: 'FULL_TIME' as const,
    workMode: 'ONSITE' as const,
    experienceLevel: 'SENIOR' as const,
    applicationType: 'DIRECT' as const,
    description: `Paytm Security Operations is hiring an SOC Lead to manage our 24x7 threat detection and response capability. You will lead a team of 8 analysts and own our SIEM and SOAR platforms.

Responsibilities:
- Lead and mentor a team of L1/L2 SOC analysts
- Develop and tune detection rules across Splunk and Microsoft Sentinel
- Drive threat hunting programs using hypothesis-driven methodology
- Own incident response for critical Paytm infrastructure
- Produce metrics and reporting for CISO and board

Requirements:
- 6+ years SOC/IR experience, 2+ years in a lead role
- Deep expertise in SIEM, EDR, and SOAR platforms
- Experience with PCI-DSS and RBI security guidelines`,
    skillNames: ['SIEM', 'Incident Response', 'Splunk', 'Threat Hunting'],
    certNames: ['GCIH', 'GCFE'],
  },
  {
    employerSlug: 'zepto',
    jobTitle: 'Application Security Engineer',
    slug: 'application-security-engineer-zepto',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `Zepto is building the security team from the ground up. We need an AppSec Engineer who can embed security into our engineering culture and drive SAST/DAST adoption.

Responsibilities:
- Conduct security design reviews and threat modelling for new features
- Run SAST/DAST pipelines and triage findings for 50+ microservices
- Perform manual code review and web/mobile application penetration testing
- Work closely with engineering to remediate vulnerabilities
- Manage bug bounty program and external researcher relationships

Requirements:
- 3+ years application security experience
- Proficiency in OWASP Top 10 and OWASP Mobile Top 10
- Experience with Burp Suite Pro, Semgrep, and SonarQube
- Strong Python or Go scripting ability
- eWPT or BSCP preferred`,
    skillNames: ['Application Security', 'Burp Suite', 'OWASP'],
    certNames: ['BSCP', 'eWPT'],
  },
  {
    employerSlug: 'crowdstrike',
    jobTitle: 'Detection Engineer',
    slug: 'detection-engineer-crowdstrike',
    jobType: 'FULL_TIME' as const,
    workMode: 'REMOTE' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `CrowdStrike's Content & Detection Engineering team is hiring. You will build and ship detection logic that protects millions of endpoints globally.

Responsibilities:
- Develop high-fidelity detection logic for the Falcon sensor
- Map adversary TTPs to MITRE ATT&CK and write corresponding detections
- Write automation scripts to improve detection pipeline efficiency
- Collaborate with threat intel and red teams to validate coverage

Requirements:
- 3+ years security engineering, detection engineering, or threat hunting
- Proficiency in Splunk SPL, KQL, or similar query languages
- Solid understanding of Windows internals and Linux security
- Experience writing YARA or Sigma rules`,
    skillNames: ['Detection Engineering', 'Splunk', 'YARA'],
    certNames: ['GDAT', 'GCED'],
  },
];

export async function seedJobs(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding employer accounts and jobs...');

  const existingJobs = await prisma.job.count({
    where: { slug: { in: JOB_TEMPLATES.map(j => j.slug) } },
  });
  if (existingJobs > 0) {
    console.log(`✅ Jobs already seeded (${existingJobs} found) — skipping`);
    return;
  }

  // Build skill + cert lookup maps
  const allSkillNames = [...new Set(JOB_TEMPLATES.flatMap(j => j.skillNames))];
  const allCertNames = [...new Set(JOB_TEMPLATES.flatMap(j => j.certNames))];

  const [skills, certs] = await Promise.all([
    prisma.skill.findMany({ where: { name: { in: allSkillNames } } }),
    prisma.certification.findMany({ where: { name: { in: allCertNames } } }),
  ]);

  const skillMap = new Map(skills.map(s => [s.name, s.id]));
  const certMap = new Map(certs.map(c => [c.name, c.id]));

  for (const emp of EMPLOYERS) {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: emp.email } });
    if (!user) {
      const hashedPw = await bcrypt.hash(emp.password, 12);
      user = await prisma.user.create({
        data: {
          email: emp.email,
          password: hashedPw,
          firstName: emp.firstName,
          lastName: emp.lastName,
          role: 'EMPLOYER',
          status: 'ACTIVE',
          isEmailVerified: true,
        },
      });
    }

    // Find or create employer profile
    let employer = await prisma.employer.findFirst({ where: { userId: user.id } });
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          userId: user.id,
          companyName: emp.companyName,
          slug: emp.slug,
          companyType: emp.companyType,
          industry: emp.industry,
          companySize: emp.companySize,
          location: emp.location,
          companyWebsite: emp.companyWebsite,
          about: emp.about,
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    // Create jobs for this employer
    const empJobs = JOB_TEMPLATES.filter(j => j.employerSlug === emp.slug);
    for (const jt of empJobs) {
      const existingJob = await prisma.job.findUnique({ where: { slug: jt.slug } });
      if (existingJob) continue;

      const job = await prisma.job.create({
        data: {
          employerId: employer.id,
          jobTitle: jt.jobTitle,
          slug: jt.slug,
          jobType: jt.jobType,
          workMode: jt.workMode,
          experienceLevel: jt.experienceLevel,
          applicationType: jt.applicationType,
          description: jt.description,
          status: 'APPROVED',
          publishedAt: new Date(),
          expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        },
      });

      const skillData = jt.skillNames
        .filter(name => skillMap.has(name))
        .map(name => ({ jobId: job.id, skillId: skillMap.get(name)! }));
      if (skillData.length > 0) {
        await prisma.jobSkill.createMany({ data: skillData, skipDuplicates: true });
      }

      const certData = jt.certNames
        .filter(name => certMap.has(name))
        .map(name => ({ jobId: job.id, certificationId: certMap.get(name)! }));
      if (certData.length > 0) {
        await prisma.jobCertification.createMany({ data: certData, skipDuplicates: true });
      }

      console.log(`  ✅ Created job: ${jt.jobTitle} @ ${emp.companyName}`);
    }
  }

  console.log('✅ Jobs seeding complete');
}
