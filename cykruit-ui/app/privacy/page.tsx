import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Lock } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: [
      "When you register as a job seeker, we collect: your name, email address, password (stored as a secure hash), profile information (skills, experience, certifications, location), and any resumes or documents you upload.",
      "When you register as an employer, we collect: company name, company type, location, official email address, phone number, and KYC verification documents submitted during the identity verification process.",
      "We also automatically collect certain usage data when you interact with the Platform, including IP address, browser type, pages visited, and timestamps. This data is used solely for platform security and performance monitoring.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "Seeker data is used to: display your profile to relevant employers, match you with job listings, send you job alerts and platform notifications, and communicate account-related information.",
      "Employer data is used to: verify your identity and organisation, display your company profile on job listings, and facilitate communication between your organisation and candidates.",
      "We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
    ],
  },
  {
    title: "3. KYC Documents",
    body: [
      "KYC documents submitted by employers are used solely for identity and business verification purposes. Documents are encrypted at rest and in transit.",
      "KYC documents are reviewed by authorised Cykruit staff only. They are not shared with job seekers, third-party services, or any external parties.",
      "Following successful verification, documents are retained for compliance purposes in accordance with applicable legal requirements.",
    ],
  },
  {
    title: "4. Data Sharing",
    body: [
      "Seeker profiles are visible to verified employers on the Platform according to the privacy settings you configure in your account.",
      "Employer company information is visible to all Platform users as part of job listings.",
      "We may share your information with third-party service providers who assist us in operating the Platform (e.g., cloud hosting, email delivery). These providers are contractually obligated to keep your data confidential and use it only to provide services to us.",
      "We may disclose your information if required by law, legal process, or government request.",
    ],
  },
  {
    title: "5. Data Retention",
    body: [
      "We retain your account information for as long as your account is active. If you delete your account, we will delete or anonymise your personal data within 30 days, except where retention is required by law.",
      "Job listings, applications, and messages are retained for 12 months after the associated job closes, after which they are permanently deleted.",
    ],
  },
  {
    title: "6. Cookies",
    body: [
      "We use cookies and similar tracking technologies to maintain your session, remember your preferences, and understand how the Platform is used.",
      "Essential cookies are required for the Platform to function and cannot be disabled. Analytics cookies are optional and can be managed through your browser settings.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "We implement industry-standard security measures to protect your personal information, including TLS encryption for data in transit, bcrypt hashing for passwords, and role-based access controls for internal systems.",
      "While we take reasonable precautions, no method of transmission over the internet or method of electronic storage is 100% secure. We cannot guarantee absolute security.",
    ],
  },
  {
    title: "8. Your Rights",
    body: [
      "You have the right to access, correct, or delete your personal information at any time through your account settings or by contacting us.",
      "You may request a copy of the data we hold about you by contacting privacy@cykruit.com. We will respond to verified requests within 30 days.",
      "You may withdraw consent for optional data processing at any time. This will not affect the lawfulness of processing carried out prior to withdrawal.",
    ],
  },
  {
    title: "9. Children's Privacy",
    body: [
      "The Platform is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will take steps to delete it promptly.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. We will notify registered users of material changes via email or a prominent notice on the Platform before the change becomes effective.",
      "Your continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "If you have questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact us at privacy@cykruit.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-slate-500 mt-2 text-sm">Last updated: June 2025</p>
            <p className="text-slate-600 mt-4 leading-relaxed max-w-2xl">
              Your privacy is important to us. This policy explains what data we collect, how we use it, and the choices you have regarding your personal information.
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
                    className="block text-xs text-slate-500 hover:text-violet-600 py-1 leading-snug transition-colors"
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
              <div className="flex items-start gap-3 px-4 py-4 bg-violet-50 border border-violet-100 rounded-xl">
                <Lock className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-xs text-violet-700 leading-relaxed">
                  Cykruit is a platform built by security professionals. We treat the confidentiality of your data with the same rigour we apply to information security — it is not a checkbox, it is a commitment.
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
