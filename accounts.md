Searched for "email"
Viewed admins.seed.ts:1-35
Listed directory data
Viewed admin.data.js:1-12
Searched for "password"

You now have a few different ways you can log in, depending on what type of account you want to test!

### Option 1: OTP Login (Job Seeker or New Employer)
Since I modified the backend earlier to print the OTP in development, you can use any email you want:
1. Go to the login page and enter an email (like `employer@cykruit.com` or your own).
2. Look at your backend terminal logs. You will see a line like:
   `[DEV] OTP email queued for employer@cykruit.com | OTP: 123456`
3. Copy that 6-digit OTP from the terminal and paste it into the UI to log in!

### Option 2: Pre-seeded Employer Accounts (Password Login)
The database seed created several realistic employer accounts that already have jobs posted. You can log into any of these using the email and password:
* **Email:** `talent@offsec.com` | **Password:** `OffSec@2025!`
* **Email:** `jobs@crowdstrike-hiring.com` | **Password:** `CrowdStrike@2025!`
* **Email:** `infosec@zepto-security.com` | **Password:** `Zepto@2025!`

### Option 3: Admin Account (Password Login)
If you need to test admin dashboard features, a super admin account was also seeded:
* **Email:** `admin@cykruit.com` | **Password:** `Admin@123`