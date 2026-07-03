// apps/seeker-profile-service/src/profile/utils/constants.ts

export const PROFILE_LIMITS = {
  MAX_CERTIFICATIONS: 30,
  MAX_EDUCATION: 10,
  MAX_EXPERIENCES: 20,
  MAX_SKILLS: 50,
  MAX_PROJECTS: 20,
  MAX_CTF_PROFILES: 10,
  MAX_RESUMES: 5,
} as const;

export const DATE_REGEX = {
  YEAR_MONTH: /^\d{4}-(0[1-9]|1[0-2])$/,
  YEAR: /^\d{4}$/,
} as const;
