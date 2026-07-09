// libs/ai/constants/ai.constants.ts
export enum AIProviderType {
  GEMINI = "gemini",
  CLAUDE = "claude",
  OPENAI = "openai",
  OPENROUTER = "openrouter",
  OLLAMA = "ollama",
}

export enum AITaskTier {
  SMALL = "small",
  HEAVY = "heavy",
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

  RESUME_PARSE: `
You are an expert technical recruiter and resume parser for cybersecurity professionals.
Parse the following resume text and extract the information into the requested JSON schema.
If any fields are missing in the resume, leave them as empty strings or empty arrays. 
Extract:
- Basic info (firstName, lastName, title, location, linkedin, github, portfolio)
- Summary (professional summary or bio)
- Experiences (array of jobs: title, company, startDate, endDate, description, isCurrent)
- Education (array: degree, school, startDate, endDate, description)
- Certifications (array: name, issuer, issueDate)
- Skills (array of strings)

Resume Text:
`,

  BIO_GENERATE: (params: { title: string; skills: string[]; experienceTitles: string[] }) => `
You are an expert cybersecurity career coach. Write a professional, compelling summary (bio) for a candidate profile (in first person). It should be 2-3 sentences.
Title: ${params.title}
Key Skills: ${params.skills.join(", ")}
Past Roles: ${params.experienceTitles.join(", ")}

IMPORTANT: Return ONLY the raw bio text. Do NOT include any conversational filler, introductory remarks (like "Here is a bio:"), or quotation marks. Output nothing but the 2-3 sentences of the bio.
`,

  SKILL_SUGGEST: (params: { title: string; currentSkills: string[] }) => `
You are a cybersecurity expert. Based on the job title "${params.title}" and existing skills [${params.currentSkills.join(", ")}], suggest 5 to 8 additional highly relevant technical skills or tools the candidate likely has but forgot to list.
Output ONLY the core technology/tool name exactly as it would appear in a database (e.g. "Python", "Kali Linux", "OWASP ZAP"). Do not include descriptive words like "programming" or "OS".
`,

  PROFILE_TIPS: (params: { missingSections: string[]; title: string }) => `
You are a cybersecurity career advisor. The candidate (Title: ${params.title}) is missing or has weak content in the following sections: ${params.missingSections.join(", ")}.
Provide exactly 3 short, actionable bullet point tips (max 1 sentence each) on how they can improve their profile to stand out to recruiters.
`,

  MATCH_SCORE: (params: { seekerTitle: string; seekerSkills: string[]; jobTitle: string; jobDescription: string; requiredSkills: string[] }) => `
You are a technical hiring manager. Evaluate the match between this candidate and the job.
Candidate Title: ${params.seekerTitle}
Candidate Skills: ${params.seekerSkills.join(", ")}
Job Title: ${params.jobTitle}
Required Skills: ${params.requiredSkills.join(", ")}
Job Description excerpt: ${params.jobDescription.substring(0, 500)}

Calculate a match score from 0 to 100 based on title alignment and skill overlap. Also provide 2 brief reasons for the score.
`
};

