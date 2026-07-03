import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using Cykruit (\"the Platform\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform.",
      "These terms apply to all users of the Platform, including job seekers, employers, and visitors. We reserve the right to update these terms at any time. Continued use of the Platform following any changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years of age to create an account and use the Platform. By registering, you represent and warrant that you meet this requirement.",
      "Employers must be a legally registered organisation and provide accurate company information during registration and the KYC verification process.",
    ],
  },
  {
    title: "3. Accounts",
    body: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised use of your account.",
      "You agree to provide accurate, current, and complete information when creating your account and to update this information as necessary.",
      "We reserve the right to suspend or terminate accounts that violate these terms, contain false or misleading information, or have been inactive for an extended period.",
    ],
  },
  {
    title: "4. Seeker Obligations",
    body: [
      "Job seekers agree to provide truthful information in their profiles, including accurate descriptions of experience, certifications, and skills. Misrepresentation is grounds for immediate account termination.",
      "You agree not to apply for roles you are not genuinely interested in or qualified for, and not to use the Platform to harvest employer contact information.",
    ],
  },
  {
    title: "5. Employer Obligations",
    body: [
      "Employers must complete identity verification (KYC) before posting jobs. You represent that all job listings are for genuine, lawful employment opportunities.",
      "Job postings must be accurate and not misleading. Postings for roles that do not exist, bait-and-switch listings, or roles intended to collect candidate data without genuine hiring intent are strictly prohibited.",
      "Employers may not contact candidates for purposes outside of the hiring process represented in the job listing.",
    ],
  },
  {
    title: "6. Prohibited Conduct",
    body: [
      "You agree not to use the Platform for any unlawful purpose or in any way that could damage, disable, or impair the Platform.",
      "Prohibited activities include: scraping or harvesting data without authorisation, posting malicious content, impersonating another person or organisation, attempting to gain unauthorised access to any part of the Platform, and using automated tools to interact with the Platform without our prior consent.",
    ],
  },
  {
    title: "7. Intellectual Property",
    body: [
      "All content on the Platform, including design, text, graphics, logos, and software, is the property of Cykruit or its licensors and is protected by applicable intellectual property laws.",
      "User-submitted content (profiles, job listings, messages) remains your property. By submitting content, you grant Cykruit a non-exclusive, worldwide, royalty-free licence to display and use that content for the purpose of operating the Platform.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    body: [
      "Cykruit provides the Platform on an \"as is\" and \"as available\" basis. We do not guarantee uninterrupted or error-free operation.",
      "To the fullest extent permitted by law, Cykruit shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to loss of data, loss of revenue, or failure to secure employment.",
    ],
  },
  {
    title: "9. Termination",
    body: [
      "We reserve the right to suspend or terminate your access to the Platform at any time, with or without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.",
      "Upon termination, your right to use the Platform will immediately cease. Provisions that by their nature should survive termination will remain in effect.",
    ],
  },
  {
    title: "10. Governing Law",
    body: [
      "These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the competent courts.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "If you have any questions about these Terms of Service, please contact us at legal@cykruit.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-slate-500 mt-2 text-sm">Last updated: June 2025</p>
            <p className="text-slate-600 mt-4 leading-relaxed max-w-2xl">
              Please read these terms carefully before using the Cykruit platform. They govern your access to and use of our services as a job seeker, employer, or visitor.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

            {/* Sticky TOC */}
            <aside className="hidden lg:block lg:col-span-1 sticky top-24">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Contents</p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.title}
                    href={`#${s.title.replace(/\s+/g, "-").toLowerCase()}`}
                    className="block text-xs text-slate-500 hover:text-blue-600 py-1 leading-snug transition-colors"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Body */}
            <div className="lg:col-span-3 space-y-10">
              {SECTIONS.map((s) => (
                <section key={s.title} id={s.title.replace(/\s+/g, "-").toLowerCase()}>
                  <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{s.title}</h2>
                  <div className="space-y-3">
                    {s.body.map((p, i) => (
                      <p key={i} className="text-sm text-slate-600 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </section>
              ))}

              {/* Footer note */}
              <div className="flex items-start gap-3 px-4 py-4 bg-blue-50 border border-blue-100 rounded-xl">
                <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Cykruit is built for the cybersecurity community. We take the integrity of our platform seriously and hold all users — seekers and employers — to the highest standard of honesty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
