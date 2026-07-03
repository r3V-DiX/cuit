export type MessageFrom = "seeker" | "employer";

export type Message = {
  id: number;
  from: MessageFrom;
  text: string;
  time: string;
  timeTs: number;
};

export type Conversation = {
  id: string;
  candidateName: string;
  candidateInitials: string;
  candidateAccent: string;
  companyName: string;
  companyInitials: string;
  companyAccent: string;
  jobTitle: string;
  jobId: number;
  messages: Message[];
  seekerUnread: number;
  employerUnread: number;
};

const now = 1750000000000; // fixed base so no Date.now() in module scope

export const CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    candidateName: "Aryan Mehta",
    candidateInitials: "AM",
    candidateAccent: "bg-blue-600",
    companyName: "CrowdStrike",
    companyInitials: "CS",
    companyAccent: "bg-red-600",
    jobTitle: "Senior Penetration Tester",
    jobId: 1,
    seekerUnread: 0,
    employerUnread: 0,
    messages: [
      { id: 1, from: "employer", text: "Hi Aryan, we reviewed your application for the Senior Pentester role and we're impressed. Are you available for a quick call this week?", time: "Jun 19, 10:02 AM", timeTs: now - 3 * 86400000 },
      { id: 2, from: "seeker",   text: "Hi! Absolutely, I'd love to chat. I'm available Thursday afternoon or Friday morning — does either work?", time: "Jun 19, 10:45 AM", timeTs: now - 3 * 86400000 + 2580000 },
      { id: 3, from: "employer", text: "Thursday at 3 PM IST works perfectly. I'll send a calendar invite to your registered email.", time: "Jun 19, 11:03 AM", timeTs: now - 3 * 86400000 + 3660000 },
      { id: 4, from: "seeker",   text: "Great, confirmed! Looking forward to it.", time: "Jun 19, 11:15 AM", timeTs: now - 3 * 86400000 + 4380000 },
      { id: 5, from: "employer", text: "Just a heads up — the call will be with our red team lead, not HR. We prefer a technical first conversation. Is that fine?", time: "Jun 20, 9:30 AM", timeTs: now - 2 * 86400000 },
      { id: 6, from: "seeker",   text: "That's actually perfect — I'd love to discuss the technical side directly. I've been preparing some of my recent engagement scenarios.", time: "Jun 20, 9:48 AM", timeTs: now - 2 * 86400000 + 1080000 },
      { id: 7, from: "employer", text: "Sounds great. See you Thursday! 🎯", time: "Jun 20, 10:00 AM", timeTs: now - 2 * 86400000 + 1800000 },
      { id: 8, from: "seeker",   text: "Looking forward to it!", time: "Jun 20, 10:05 AM", timeTs: now - 2 * 86400000 + 2100000 },
    ],
  },
  {
    id: "conv-2",
    candidateName: "Aryan Mehta",
    candidateInitials: "AM",
    candidateAccent: "bg-blue-600",
    companyName: "Microsoft",
    companyInitials: "MS",
    companyAccent: "bg-sky-600",
    jobTitle: "Red Team Operator",
    jobId: 9,
    seekerUnread: 1,
    employerUnread: 0,
    messages: [
      { id: 1, from: "employer", text: "Hello Aryan, I'm Sarah from Microsoft's MSRC recruiting team. We came across your profile and think you'd be a great fit for our Red Team Operator role.", time: "Jun 21, 2:00 PM", timeTs: now - 86400000 },
      { id: 2, from: "seeker",   text: "Hi Sarah, thanks for reaching out! I actually applied for this role last week — very excited about the opportunity.", time: "Jun 21, 2:30 PM", timeTs: now - 86400000 + 1800000 },
      { id: 3, from: "employer", text: "We saw that! Your OSCP, CRTO, and Active Directory experience stood out. We'd like to move you to a technical screen.", time: "Jun 21, 3:10 PM", timeTs: now - 86400000 + 4200000 },
      { id: 4, from: "seeker",   text: "I'd be happy to proceed. What does the technical screen involve?", time: "Jun 21, 3:25 PM", timeTs: now - 86400000 + 5100000 },
      { id: 5, from: "employer", text: "It's a 45-minute call with two of our red teamers — a scenario-based conversation on attack chains and evasion techniques. No live hacking at this stage, just discussion.", time: "Jun 22, 9:15 AM", timeTs: now - 43200000 },
    ],
  },
  {
    id: "conv-3",
    candidateName: "Aryan Mehta",
    candidateInitials: "AM",
    candidateAccent: "bg-blue-600",
    companyName: "Okta",
    companyInitials: "OK",
    companyAccent: "bg-cyan-600",
    jobTitle: "Identity Security Architect",
    jobId: 6,
    seekerUnread: 1,
    employerUnread: 0,
    messages: [
      { id: 1, from: "employer", text: "Hi Aryan, we noticed you viewed our Identity Security Architect listing. We have a similar engagement opening next month — would you be interested in learning more?", time: "Jun 21, 11:00 AM", timeTs: now - 86400000 - 10800000 },
      { id: 2, from: "seeker",   text: "Hi! I'm primarily looking for full-time roles right now, but I'd be open to hearing more depending on the scope.", time: "Jun 21, 11:40 AM", timeTs: now - 86400000 - 8400000 },
      { id: 3, from: "employer", text: "Understood! It's a 6-month engagement with a strong chance of full-time conversion. Happy to set up a 20-minute call if you'd like the details.", time: "Jun 22, 8:45 AM", timeTs: now - 46800000 },
    ],
  },
  {
    id: "conv-4",
    candidateName: "Aryan Mehta",
    candidateInitials: "AM",
    candidateAccent: "bg-blue-600",
    companyName: "IBM Security",
    companyInitials: "IB",
    companyAccent: "bg-slate-700",
    jobTitle: "Incident Response Lead",
    jobId: 8,
    seekerUnread: 1,
    employerUnread: 0,
    messages: [
      { id: 1, from: "employer", text: "Hi Aryan, I'm reaching out from IBM Security's X-Force team. We're hiring for an Incident Response Lead and your background in red teaming and DFIR caught our attention. Would you be open to a conversation?", time: "Jun 22, 4:00 PM", timeTs: now - 14400000 },
    ],
  },
  {
    id: "conv-5",
    candidateName: "Priya Sharma",
    candidateInitials: "PS",
    candidateAccent: "bg-violet-600",
    companyName: "CrowdStrike",
    companyInitials: "CS",
    companyAccent: "bg-red-600",
    jobTitle: "Cloud Security Engineer",
    jobId: 2,
    seekerUnread: 0,
    employerUnread: 2,
    messages: [
      { id: 1, from: "employer", text: "Hi Priya, we've reviewed your application and are keen to move forward. Are you still available for the Cloud Security Engineer role?", time: "Jun 20, 1:00 PM", timeTs: now - 2 * 86400000 + 3600000 },
      { id: 2, from: "seeker",   text: "Yes, absolutely! I'm very excited about this opportunity at CrowdStrike.", time: "Jun 20, 1:45 PM", timeTs: now - 2 * 86400000 + 6300000 },
      { id: 3, from: "seeker",   text: "I also wanted to ask — does the role involve working with Prisma Cloud specifically, or is it more platform-agnostic?", time: "Jun 20, 1:46 PM", timeTs: now - 2 * 86400000 + 6360000 },
    ],
  },
];
