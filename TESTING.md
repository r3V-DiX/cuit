# Cykruit — Manual Testing Checklist

> Only sections where frontend is wired to backend.
>
> - `[ ]` = not tested
> - `[x]` = passed
> - `[!]` = bug — add notes below item
>
> Use bug template at bottom when reporting.

---

## 1. Auth

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 1 | Register as Seeker | `POST /auth/register` |
| 2 | Register as Employer | `POST /auth/register` |
| 3 | Register with existing email → specific error shown | `POST /auth/register` |
| 4 | Verification email arrives after register | `POST /auth/resend-verification` |
| 5 | Click verify link → success screen | `POST /auth/verify-email` |
| 6 | Expired/invalid verify link → error screen | `POST /auth/verify-email` |
| 7 | Resend verification email button | `POST /auth/resend-verification` |
| 8 | Login as Seeker → goes to `/dashboard` | `POST /auth/login` |
| 9 | Login as Employer → goes to `/employer/dashboard` | `POST /auth/login` |
| 10 | Login wrong password → error message | `POST /auth/login` |
| 11 | Login unverified account → error message | `POST /auth/login` |
| 12 | Google OAuth → lands on correct dashboard | `GET /auth/google` |
| 13 | Forgot password → email sent | `POST /auth/forgot-password` |
| 14 | Reset link → set new password → login works | `POST /auth/reset-password` |
| 15 | Logout → goes to `/login` | `POST /auth/logout` |
| 16 | Access protected route logged out → `/login?redirect=...` | middleware |
| 17 | Change password (correct current) → success | `PATCH /auth/change-password` |
| 18 | Change password (wrong current) → error | `PATCH /auth/change-password` |
| 19 | Delete account with password confirm | `DELETE /auth/account` |

---

## 2. Seeker — Profile

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 20 | Profile page loads with correct user data | `GET /profile` |
| 21 | Profile completion % shown | `GET /profile/completion` |
| 22 | Edit basic info (title, phone, location, links) → save → persists | `PATCH /profile/basic-info` |
| 23 | Upload profile image | `PATCH /profile/image` |
| 24 | Delete profile image | `DELETE /profile/image` |
| 25 | Edit bio/summary → save → persists | `PATCH /profile/summary` |
| 26 | Add skill | `POST /skills` |
| 27 | Remove skill | `DELETE /skills/:id` |
| 28 | Add work experience | `POST /experiences` |
| 29 | Edit work experience | `PATCH /experiences/:id` |
| 30 | Delete work experience | `DELETE /experiences/:id` |
| 31 | Add education | `POST /education` |
| 32 | Edit education | `PATCH /education/:id` |
| 33 | Delete education | `DELETE /education/:id` |
| 34 | Add certification | `POST /certifications` |
| 35 | Delete certification | `DELETE /certifications/:id` |
| 36 | Add CTF profile | `POST /ctf-profiles` |
| 37 | Delete CTF profile | `DELETE /ctf-profiles/:id` |
| 38 | Upload resume (PDF) | `POST /resumes` |
| 39 | Delete resume | `DELETE /resumes/:id` |

---

## 3. Seeker — Settings

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 40 | Settings page loads with current data | `GET /settings` |
| 41 | Save general preferences → persists | `PATCH /settings/general` |
| 42 | Save notification preferences → persists | `PATCH /settings/notifications` |

---

## 4. Employer — Jobs

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 43 | Jobs list loads (real data, not hardcoded) | `GET /employer/jobs` |
| 44 | Filter jobs by status | `GET /employer/jobs?status=` |
| 45 | Search jobs by title | `GET /employer/jobs?search=` |
| 46 | Pagination works | `GET /employer/jobs?page=` |
| 47 | Create job → Save as Draft | `POST /employer/jobs` |
| 48 | Create job → Publish | `POST /employer/jobs` + `POST /employer/jobs/:id/submit` |
| 49 | Missing required field → validation error | client-side |
| 50 | Screening questions saved (text/single/boolean) | `POST /employer/jobs` |
| 51 | Edit draft job → save → persists | `PATCH /employer/jobs/:id` |
| 52 | Delete draft job → removed from list | `DELETE /employer/jobs/:id` |
| 53 | Job detail page loads correct data | `GET /employer/jobs/:id` |

---

## 5. Public — Browse Jobs `/jobs`

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 54 | Jobs list loads | `GET /public/jobs` |
| 55 | Search by keyword | `GET /public/jobs?search=` |
| 56 | Filter by job type (Full-time etc.) | `GET /public/jobs?jobType=` |
| 57 | Filter by work mode (Remote etc.) | `GET /public/jobs?workMode=` |
| 58 | Pagination | `GET /public/jobs?page=` |
| 59 | No results → empty state shown | `GET /public/jobs` |

---

## 6. Landing Page — Featured Jobs

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 63 | Featured jobs section shows real jobs (not hardcoded) | `GET /public/jobs?limit=6` |
| 64 | Each card shows correct company name, job title, location | `GET /public/jobs` |
| 65 | Tags (skills/certs) appear on cards | `GET /public/jobs` |
| 66 | "View all jobs" link goes to `/jobs` | client-side |
| 67 | Clicking a card goes to `/jobs/:slug` | client-side |
| 68 | Empty state shown when no approved jobs | `GET /public/jobs` |
| 69 | Section revalidates every 5 minutes (not stale on reload) | `next: { revalidate: 300 }` |

---

## 7. Contact Page `/contact`

| # | What to Test | Backend Route |
|---|-------------|---------------|
| 70 | Contact page loads | — |
| 71 | Submit with all fields → success screen shown | `POST /public/contact` |
| 72 | Submit with empty name → error toast | client-side |
| 73 | Submit with empty email → error toast | client-side |
| 74 | Submit with empty/short message → error toast | client-side |
| 75 | Backend error (e.g. rate limit) → error toast with message | `POST /public/contact` |
| 76 | Rate limit: 4th submission within an hour → 429 error shown | `POST /public/contact` |
| 77 | "Send another message" button resets form | client-side |

---

## 8. Error Handling

| # | What to Test | Expected |
|---|-------------|----------|
| 78 | Stop backend → submit any form | Error toast shown, spinner stops |
| 79 | Backend returns specific error (e.g. email taken) | Specific message shown, not "Something went wrong" |
| 80 | Paste 1000+ chars in description field | Capped at maxLength |

---

## Bug Report Template

```
Test #:
Section:
Action: [what you did]
Expected: [what should happen]
Got: [what happened]
Error: [console/network error if any]
```
