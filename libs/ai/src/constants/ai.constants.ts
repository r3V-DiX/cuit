// libs/ai/constants/ai.constants.ts
export enum AIProviderType {
  GEMINI = "gemini",
  CLAUDE = "claude",
  OPENAI = "openai",
}

export const AI_PROMPTS = {
  JOB_DESCRIPTION: (params: {
    jobTitle: string;
    roleDescription: string;
    experienceLevel: string;
    workMode: string;
    requiredSkills?: string[];
    preferredCertifications?: string[];
  }) => `
You are a professional cybersecurity HR specialist. Generate a concise job description (400-600 words) in clean HTML.

Job Details:
- Title: ${params.jobTitle}
- Role: ${params.roleDescription}
- Experience: ${params.experienceLevel}
- Work Mode: ${params.workMode}
${params.requiredSkills?.length ? `- Skills: ${params.requiredSkills.join(", ")}` : ""}
${params.preferredCertifications?.length ? `- Certs: ${params.preferredCertifications.join(", ")}` : ""}

Include: Overview, Key Responsibilities, Required Qualifications, Preferred Qualifications, What We Offer.
Use ONLY: <h3>, <p>, <ul>, <li>, <strong>. Output ONLY the HTML. NO markdown.
`,

  PDF_EXTRACTION: `
Extract ALL text from this PDF and return it as HTML.
Use ONLY: <h3>, <p>, <ul>, <li>, <strong>, <em>.
Return ONLY the HTML content. NO markdown, NO code blocks.
`,
};
