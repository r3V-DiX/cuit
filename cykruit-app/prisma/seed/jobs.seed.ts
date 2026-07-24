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
  {
    email: 'yograj.hukumdar@rivedix.com',
    password: 'Rivedix@2025!',
    firstName: 'Yograj',
    lastName: 'Hukumdar',
    companyName: 'Rivedix Technology Solutions',
    slug: 'rivedix',
    companyType: 'PRIVATE_LIMITED_COMPANY' as const,
    industry: 'TECHNOLOGY' as const,
    companySize: 'SIZE_11_50' as const,
    location: 'Pune, IN',
    companyWebsite: 'https://rivedix.com',
    about: 'Rivedix is a practitioner-grade cybersecurity consultancy delivering offensive security, defensive security, cyber GRC, data privacy, AI governance, and vCISO advisory. Outcome-first approach — not checklist compliance.',
  },
];

const JOB_TEMPLATES = [
  {
    employerSlug: 'offsec',
    roleName: 'Penetration Tester',
    jobTitle: 'Senior Penetration Tester',
    slug: 'senior-penetration-tester-offsec',
    jobType: 'FULL_TIME' as const,
    workMode: 'REMOTE' as const,
    experienceLevel: 'SENIOR' as const,
    applicationType: 'DIRECT' as const,
    description: `We are looking for a Senior Penetration Tester to join our red team operations group. You will conduct advanced offensive security assessments for enterprise clients, develop custom exploitation tooling, and contribute to our world-class training curriculum.`,
    responsibilities: [
      'Lead complex penetration testing engagements across network, web, mobile, and Active Directory environments',
      'Develop and maintain custom C2 implants and post-exploitation tooling',
      'Write clear, actionable remediation reports for technical and executive audiences',
      'Mentor junior pentesters and contribute to internal knowledge base',
      'Stay current with the latest CVEs, exploitation techniques, and offensive tooling',
    ],
    requirements: [
      'OSCP required; OSED, OSEP, or CRTO strongly preferred',
      '5+ years hands-on offensive security experience',
      'Proficiency in Python, C, and PowerShell',
      'Experience with Cobalt Strike, Havoc C2, or custom C2 tooling',
      'Deep understanding of Active Directory attack paths and lateral movement techniques',
    ],
    skillNames: ['Penetration Testing', 'Active Directory', 'Python', 'Cobalt Strike'],
    certNames: ['OSCP', 'CRTO'],
  },
  {
    employerSlug: 'crowdstrike',
    roleName: 'Threat Intelligence Analyst',
    jobTitle: 'Threat Intelligence Analyst',
    slug: 'threat-intelligence-analyst-crowdstrike',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `CrowdStrike Intelligence is hiring a Threat Intelligence Analyst to track nation-state and eCrime adversaries. You will produce finished intelligence products and track TTPs across the MITRE ATT&CK framework.`,
    responsibilities: [
      'Track and profile advanced persistent threat (APT) groups and eCrime actors',
      'Produce strategic and tactical threat intelligence reports for internal and client consumption',
      'Perform malware analysis and reverse engineering of threat actor tooling',
      'Maintain and enrich threat actor profiles and indicator databases',
      'Collaborate with red team and detection engineering to improve coverage',
    ],
    requirements: [
      '3+ years threat intelligence or threat hunting experience',
      'Proficiency in YARA, Sigma, and MITRE ATT&CK framework',
      'Experience with sandbox analysis tools (Any.run, Cuckoo, Triage)',
      'Familiarity with dark web monitoring and OSINT techniques',
      'Strong written communication skills for executive-level briefings',
    ],
    skillNames: ['Threat Intelligence', 'Malware Analysis', 'MITRE ATT&CK', 'YARA'],
    certNames: ['GCTI', 'GREM'],
  },
  {
    employerSlug: 'razorpay',
    roleName: 'Cloud Security Engineer',
    jobTitle: 'Cloud Security Engineer',
    slug: 'cloud-security-engineer-razorpay',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `Razorpay is looking for a Cloud Security Engineer to secure our AWS and GCP infrastructure at scale. You will own cloud security posture management and build security automation pipelines.`,
    responsibilities: [
      'Implement and maintain CSPM tooling (Wiz, Prisma Cloud) across multi-cloud environments',
      'Design IAM policies and enforce least-privilege access across 200+ AWS accounts',
      'Build IaC security scanning pipelines using Terraform and CDK',
      'Respond to cloud security incidents and conduct cloud forensics',
      'Own PCI-DSS and SOC 2 cloud control evidence collection and reporting',
    ],
    requirements: [
      'AWS Security Specialty or GCP Professional Cloud Security Engineer certification',
      '3+ years cloud security engineering experience',
      'Strong Terraform and Python scripting skills',
      'Experience with container security, EKS, and Kubernetes RBAC',
      'Knowledge of PCI-DSS, SOC 2, and cloud compliance frameworks',
    ],
    skillNames: ['AWS', 'Cloud Security', 'Terraform', 'Kubernetes'],
    certNames: ['AWS Security Specialty', 'CCSP'],
  },
  {
    employerSlug: 'paytm',
    roleName: 'SOC Analyst (L3)',
    jobTitle: 'SOC Lead – L3 Analyst',
    slug: 'soc-lead-l3-analyst-paytm',
    jobType: 'FULL_TIME' as const,
    workMode: 'ONSITE' as const,
    experienceLevel: 'SENIOR' as const,
    applicationType: 'DIRECT' as const,
    description: `Paytm Security Operations is hiring an SOC Lead to manage our 24x7 threat detection and response capability. You will lead a team of 8 analysts and own our SIEM and SOAR platforms.`,
    responsibilities: [
      'Lead and mentor a team of L1 and L2 SOC analysts across shift rotations',
      'Develop and tune detection rules across Splunk and Microsoft Sentinel',
      'Drive threat hunting programs using hypothesis-driven methodology',
      'Own incident response for critical Paytm infrastructure and payment systems',
      'Produce weekly and monthly metrics and reporting for the CISO and board',
    ],
    requirements: [
      '6+ years SOC/IR experience with at least 2 years in a lead or senior analyst role',
      'Deep expertise in SIEM, EDR, and SOAR platforms (Splunk, Sentinel, CrowdStrike)',
      'Strong knowledge of PCI-DSS requirements and RBI security guidelines',
      'Experience with incident response playbook development and tabletop exercises',
      'GCIH, GCFE, or equivalent certification required',
    ],
    skillNames: ['SIEM', 'Incident Response', 'Splunk', 'Threat Hunting'],
    certNames: ['GCIH', 'GCFE'],
  },
  {
    employerSlug: 'zepto',
    roleName: 'Application Security Engineer',
    jobTitle: 'Application Security Engineer',
    slug: 'application-security-engineer-zepto',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `Zepto is building its security team from the ground up. We need an AppSec Engineer who can embed security into our engineering culture and drive SAST/DAST adoption across 50+ microservices.`,
    responsibilities: [
      'Conduct security design reviews and threat modelling for new product features',
      'Run SAST/DAST pipelines and triage findings across 50+ microservices',
      'Perform manual code review and web/mobile application penetration testing',
      'Work closely with engineering squads to prioritize and remediate vulnerabilities',
      'Manage the bug bounty program and maintain researcher relationships',
    ],
    requirements: [
      '3+ years application security engineering experience',
      'Proficiency in OWASP Top 10 and OWASP Mobile Top 10',
      'Hands-on experience with Burp Suite Pro, Semgrep, and SonarQube',
      'Strong Python or Go scripting ability for automation and tooling',
      'eWPT, BSCP, or equivalent web application security certification preferred',
    ],
    skillNames: ['Application Security', 'Burp Suite', 'OWASP'],
    certNames: ['BSCP', 'eWPT'],
  },
  {
    employerSlug: 'rivedix',
    roleName: 'Penetration Tester',
    jobTitle: 'Penetration Tester – Web & Network',
    slug: 'penetration-tester-web-network-rivedix',
    jobType: 'FULL_TIME' as const,
    workMode: 'HYBRID' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `Rivedix Technology Solutions is hiring a Penetration Tester to join our offensive security practice. You will conduct web application, network, and API assessments for clients across India, the US, and Europe.`,
    responsibilities: [
      'Perform black-box and grey-box web application, API, and network penetration tests',
      'Write detailed technical and executive-level reports with prioritised remediation steps',
      'Support red team engagements and adversary simulation exercises',
      'Contribute to internal tooling, methodology, and playbook development',
      'Engage across client verticals including BFSI, healthcare, and enterprise SaaS',
    ],
    requirements: [
      '2+ years hands-on penetration testing experience in professional or consulting engagements',
      'Proficiency with Burp Suite Pro, Nmap, Metasploit, and custom scripting',
      'Strong understanding of OWASP Top 10 and common network attack vectors',
      'OSCP, eWPT, or equivalent certification preferred',
      'Strong written communication for client-facing technical report delivery',
    ],
    skillNames: ['Penetration Testing', 'Burp Suite', 'Python', 'OWASP'],
    certNames: ['OSCP', 'eWPT'],
  },
  {
    employerSlug: 'crowdstrike',
    roleName: 'Security Engineer',
    jobTitle: 'Detection Engineer',
    slug: 'detection-engineer-crowdstrike',
    jobType: 'FULL_TIME' as const,
    workMode: 'REMOTE' as const,
    experienceLevel: 'MID' as const,
    applicationType: 'DIRECT' as const,
    description: `CrowdStrike's Content & Detection Engineering team is hiring. You will build and ship detection logic that protects millions of endpoints globally.`,
    responsibilities: [
      'Develop high-fidelity detection logic for the Falcon sensor across Windows, Linux, and macOS',
      'Map adversary TTPs to MITRE ATT&CK and write corresponding detection rules',
      'Write automation scripts to improve detection pipeline efficiency and coverage metrics',
      'Collaborate with threat intel and red teams to validate and tune detections',
      'Maintain detection quality through continuous false-positive analysis and tuning',
    ],
    requirements: [
      '3+ years security engineering, detection engineering, or threat hunting experience',
      'Proficiency in Splunk SPL, KQL, or similar query languages',
      'Solid understanding of Windows internals, process injection, and Linux security primitives',
      'Experience writing YARA or Sigma detection rules',
      'GDAT, GCED, or equivalent certification is a plus',
    ],
    skillNames: ['Detection Engineering', 'Splunk', 'YARA'],
    certNames: ['GDAT', 'GCED'],
  },
];

export async function seedJobs(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding employer accounts and jobs...');

  // Build skill + cert + role lookup maps
  const allSkillNames = [...new Set(JOB_TEMPLATES.flatMap(j => j.skillNames))];
  const allCertNames = [...new Set(JOB_TEMPLATES.flatMap(j => j.certNames))];
  const allRoleNames = [...new Set(JOB_TEMPLATES.map(j => j.roleName).filter(Boolean))];

  const [skills, certs, roles] = await Promise.all([
    prisma.skill.findMany({ where: { name: { in: allSkillNames } } }),
    prisma.certification.findMany({ where: { name: { in: allCertNames } } }),
    prisma.role.findMany({ where: { name: { in: allRoleNames } } }),
  ]);

  const skillMap = new Map(skills.map(s => [s.name, s.id]));
  const certMap = new Map(certs.map(c => [c.name, c.id]));
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

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
      // Also link the user as an OWNER of the newly created employer profile
      await prisma.employerMember.create({
        data: {
          employerId: employer.id,
          userId: user.id,
          role: 'OWNER',
        },
      });
    }

    // Create jobs for this employer
    const empJobs = JOB_TEMPLATES.filter(j => j.employerSlug === emp.slug);
    for (const jt of empJobs) {
      const roleId = jt.roleName ? (roleMap.get(jt.roleName) ?? null) : null;

      const existingJob = await prisma.job.findUnique({ where: { slug: jt.slug } });
      if (existingJob) {
        if (existingJob.requirements === null || existingJob.responsibilities === null) {
          await prisma.job.update({
            where: { id: existingJob.id },
            data: {
              requirements: jt.requirements,
              responsibilities: jt.responsibilities,
              ...(roleId && !existingJob.roleId ? { roleId } : {}),
            },
          });
          console.log(`  🔄 Updated job: ${jt.jobTitle} @ ${emp.companyName}`);
        }
        continue;
      }

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
          requirements: jt.requirements,
          responsibilities: jt.responsibilities,
          ...(roleId ? { roleId } : {}),
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
