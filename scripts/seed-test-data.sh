#!/bin/bash
# seed-test-data.sh — seed employer accounts, subscriptions, and jobs
# Run: sudo bash scripts/seed-test-data.sh
# Requires: containers running, .env.prod present
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
step()  { echo -e "${BLUE}[STEP]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

DEPLOY_DIR="/opt/cykruit-v2"
ENV_FILE="${DEPLOY_DIR}/.env.prod"
[ -f "${DEPLOY_DIR}/.env.staging" ] && ENV_FILE="${DEPLOY_DIR}/.env.staging"
[ -f "${DEPLOY_DIR}/.env.prod" ]    && ENV_FILE="${DEPLOY_DIR}/.env.prod"

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2-)
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?.*$//')

run_sql() {
  docker run --rm \
    --network cykruit-v2_default \
    postgres:15-alpine \
    psql "$PSQL_URL" -t -A -X -c "$1" 2>/dev/null | tr -d '[:space:]'
}

run_sql_multi() {
  docker run --rm \
    --network cykruit-v2_default \
    postgres:15-alpine \
    psql "$PSQL_URL" -X 2>/dev/null <<SQL
$1
SQL
}

hash_password() {
  local plain="$1"
  docker exec cykruit-v2-auth-service-1 node -e \
    "const b=require('bcryptjs');b.hash('${plain}',10).then(h=>process.stdout.write(h))"
}

step "Seeding employer accounts, subscriptions, and jobs..."

# ── 1. Hash passwords ──────────────────────────────────────────────────────────
info "Hashing passwords..."
RIVEDIX_HASH=$(hash_password "Rivedix@2025!")
RKAVACH_HASH=$(hash_password "RKavach@2025!")
SEEKER_HASH=$(hash_password "Test@1234")
info "Done."

# ── 2. Lookup skill IDs ────────────────────────────────────────────────────────
SKILL_PENTEST=$(run_sql "SELECT id FROM skills WHERE name='Penetration Testing' LIMIT 1;")
SKILL_BURP=$(run_sql "SELECT id FROM skills WHERE name='Burp Suite' LIMIT 1;")
SKILL_PYTHON=$(run_sql "SELECT id FROM skills WHERE name='Python' LIMIT 1;")
SKILL_AWS=$(run_sql "SELECT id FROM skills WHERE name='AWS' LIMIT 1;")
SKILL_APPSEC=$(run_sql "SELECT id FROM skills WHERE name='Application Security' LIMIT 1;")
SKILL_TERRAFORM=$(run_sql "SELECT id FROM skills WHERE name='Terraform' LIMIT 1;")
SKILL_CLOUDSEC=$(run_sql "SELECT id FROM skills WHERE name='Cloud Security' LIMIT 1;")
SKILL_OWASP=$(run_sql "SELECT id FROM skills WHERE name='OWASP' LIMIT 1;")

# ── 3. Lookup package IDs ──────────────────────────────────────────────────────
FREE_PKG_ID=$(run_sql "SELECT id FROM subscription_packages WHERE name='Free' LIMIT 1;")
GROWTH_PKG_ID=$(run_sql "SELECT id FROM subscription_packages WHERE name='Growth' LIMIT 1;")
info "Free: $FREE_PKG_ID | Growth: $GROWTH_PKG_ID"

# ── 4. Rivedix employer ────────────────────────────────────────────────────────
step "Creating Rivedix employer (yograj.hukumdar@rivedix.com)..."
RIVEDIX_USER_ID=$(run_sql "SELECT id FROM users WHERE email='yograj.hukumdar@rivedix.com' LIMIT 1;")

if [ -z "$RIVEDIX_USER_ID" ]; then
  RIVEDIX_USER_ID=$(run_sql "
    INSERT INTO users (id, email, password, \"firstName\", \"lastName\", role, status, \"isEmailVerified\", \"emailVerifiedAt\", \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), 'yograj.hukumdar@rivedix.com', '$RIVEDIX_HASH', 'Yograj', 'Hukumdar', 'EMPLOYER', 'ACTIVE', true, now(), now(), now())
    RETURNING id;")
  info "Created user: $RIVEDIX_USER_ID"
else
  info "User already exists: $RIVEDIX_USER_ID"
fi

RIVEDIX_ID=$(run_sql "SELECT id FROM employers WHERE \"userId\"='$RIVEDIX_USER_ID' LIMIT 1;")
if [ -z "$RIVEDIX_ID" ]; then
  RIVEDIX_ID=$(run_sql "
    INSERT INTO employers (id, \"userId\", \"companyName\", \"companyType\", industry, \"companySize\", location, slug, \"companyWebsite\", about, \"isVerified\", \"verifiedAt\", \"isActive\", \"profileCompletion\", \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), '$RIVEDIX_USER_ID', 'Rivedix Technology Solutions', 'PRIVATE_LIMITED_COMPANY', 'TECHNOLOGY', 'SIZE_11_50', 'Pune, IN', 'rivedix', 'https://rivedix.com', 'Rivedix is a practitioner-grade cybersecurity consultancy delivering offensive security, defensive security, cyber GRC, data privacy, AI governance, and vCISO advisory.', true, now(), true, 90, now(), now())
    RETURNING id;")
  info "Created employer: $RIVEDIX_ID"

  run_sql_multi "
    INSERT INTO employer_members (id, \"employerId\", \"userId\", role, \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), '$RIVEDIX_ID', '$RIVEDIX_USER_ID', 'OWNER', now(), now())
    ON CONFLICT DO NOTHING;"

  if [ -n "$FREE_PKG_ID" ]; then
    run_sql_multi "
      INSERT INTO employer_subscriptions (id, \"employerId\", \"packageId\", status, \"startedAt\", \"expiresAt\", \"createdAt\", \"updatedAt\")
      VALUES (gen_random_uuid(), '$RIVEDIX_ID', '$FREE_PKG_ID', 'ACTIVE', now(), now() + interval '1 year', now(), now())
      ON CONFLICT DO NOTHING;"
    info "Assigned Free subscription to Rivedix"
  fi
else
  info "Employer already exists: $RIVEDIX_ID"
fi

# ── 5. RKavach employer ────────────────────────────────────────────────────────
step "Creating RKavach employer (support@rkavach.com) with Growth subscription..."
RKAVACH_USER_ID=$(run_sql "SELECT id FROM users WHERE email='support@rkavach.com' LIMIT 1;")

if [ -z "$RKAVACH_USER_ID" ]; then
  RKAVACH_USER_ID=$(run_sql "
    INSERT INTO users (id, email, password, \"firstName\", \"lastName\", role, status, \"isEmailVerified\", \"emailVerifiedAt\", \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), 'support@rkavach.com', '$RKAVACH_HASH', 'Support', 'Team', 'EMPLOYER', 'ACTIVE', true, now(), now(), now())
    RETURNING id;")
  info "Created user: $RKAVACH_USER_ID"
else
  info "User already exists: $RKAVACH_USER_ID"
fi

RKAVACH_ID=$(run_sql "SELECT id FROM employers WHERE \"userId\"='$RKAVACH_USER_ID' LIMIT 1;")
if [ -z "$RKAVACH_ID" ]; then
  RKAVACH_ID=$(run_sql "
    INSERT INTO employers (id, \"userId\", \"companyName\", \"companyType\", industry, \"companySize\", location, slug, \"companyWebsite\", about, \"isVerified\", \"verifiedAt\", \"isActive\", \"profileCompletion\", \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), '$RKAVACH_USER_ID', 'RKavach', 'PRIVATE_LIMITED_COMPANY', 'TECHNOLOGY', 'SIZE_11_50', 'Pune, IN', 'rkavach', 'https://rkavach.com', 'RKavach is a cybersecurity product and services company building intelligent security solutions for modern enterprises — from managed detection to GRC automation.', true, now(), true, 90, now(), now())
    RETURNING id;")
  info "Created employer: $RKAVACH_ID"

  run_sql_multi "
    INSERT INTO employer_members (id, \"employerId\", \"userId\", role, \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), '$RKAVACH_ID', '$RKAVACH_USER_ID', 'OWNER', now(), now())
    ON CONFLICT DO NOTHING;"

  if [ -n "$GROWTH_PKG_ID" ]; then
    run_sql_multi "
      INSERT INTO employer_subscriptions (id, \"employerId\", \"packageId\", status, \"billingCycle\", \"startedAt\", \"expiresAt\", \"createdAt\", \"updatedAt\")
      VALUES (gen_random_uuid(), '$RKAVACH_ID', '$GROWTH_PKG_ID', 'ACTIVE', 'YEARLY', now(), now() + interval '1 year', now(), now())
      ON CONFLICT DO NOTHING;"
    info "Assigned Growth subscription to RKavach"
  fi
else
  info "Employer already exists: $RKAVACH_ID"
fi

# ── 6. Jobs ────────────────────────────────────────────────────────────────────
step "Creating jobs..."

create_job() {
  local emp_id="$1" title="$2" slug="$3" jtype="$4" wmode="$5" level="$6" featured="$7" desc="$8" reqs="$9" resps="${10}"
  local existing
  existing=$(run_sql "SELECT id FROM jobs WHERE slug='$slug' LIMIT 1;")
  if [ -z "$existing" ]; then
    local jid
    jid=$(run_sql "
      INSERT INTO jobs (id, \"employerId\", \"jobTitle\", slug, \"jobType\", \"workMode\", \"experienceLevel\", description, requirements, responsibilities, \"applicationType\", \"isFeatured\", status, \"publishedAt\", \"expiresAt\", \"createdAt\", \"updatedAt\")
      VALUES (gen_random_uuid(), '$emp_id', '$title', '$slug', '$jtype', '$wmode', '$level', '$desc', '$reqs'::jsonb, '$resps'::jsonb, 'DIRECT', $featured, 'APPROVED', now(), now() + interval '45 days', now(), now())
      RETURNING id;")
    echo "$jid"
  else
    echo "$existing"
  fi
}

# Rivedix jobs
RJOB1_ID=$(create_job "$RIVEDIX_ID" \
  "Penetration Tester – Web & Network" "penetration-tester-web-network-rivedix" "FULL_TIME" "HYBRID" "MID" "false" \
  "Rivedix Technology Solutions is hiring a Penetration Tester to join our offensive security practice. You will conduct web application, network, and API assessments for clients across India, the US, and Europe." \
  '["2+ years hands-on penetration testing experience","Proficiency with Burp Suite Pro, Nmap, Metasploit","Strong understanding of OWASP Top 10","OSCP or eWPT certification preferred","Strong written communication for client-facing reports"]' \
  '["Perform black-box and grey-box web application and API penetration tests","Write detailed technical and executive-level reports","Support red team engagements and adversary simulation","Contribute to internal tooling and playbook development","Engage across BFSI, healthcare, and enterprise SaaS clients"]')
info "Rivedix job 1: $RJOB1_ID"

RJOB2_ID=$(create_job "$RIVEDIX_ID" \
  "Cyber GRC Analyst" "cyber-grc-analyst-rivedix" "FULL_TIME" "HYBRID" "MID" "false" \
  "Rivedix is hiring a Cyber GRC Analyst to support our growing governance, risk, and compliance practice. You will work with enterprise clients against ISO 27001, SOC 2, and RBI/SEBI regulatory frameworks." \
  '["2+ years GRC, audit, or compliance experience","Working knowledge of ISO 27001, SOC 2 Type II, and NIST CSF","Familiarity with India DPDP Act 2023 and GDPR","ISO 27001 Lead Implementer or Lead Auditor certification preferred","Strong written communication and stakeholder management"]' \
  '["Conduct risk assessments and gap analyses","Support clients through ISMS implementation and audit preparation","Draft and review security policies and control documentation","Assist with data privacy impact assessments","Deliver client workshops and stakeholder awareness sessions"]')
info "Rivedix job 2: $RJOB2_ID"

# RKavach featured jobs
RKJOB1_ID=$(create_job "$RKAVACH_ID" \
  "Product Security Engineer" "product-security-engineer-rkavach" "FULL_TIME" "HYBRID" "MID" "true" \
  "RKavach is hiring a Product Security Engineer to embed security across our product development lifecycle. You will own threat modelling, secure code review, and vulnerability management for our SaaS security platform." \
  '["3+ years application security or product security experience","Strong knowledge of OWASP Top 10 and API security","Hands-on experience with SAST/DAST tools and CI/CD security integrations","Proficiency in at least one backend language: Node.js, Go, or Python","BSCP, OSWE, or eWPTX certification preferred"]' \
  '["Lead threat modelling and secure design reviews for new features","Perform manual and automated code reviews across Node.js and Go microservices","Manage vulnerability disclosure program and triage bug bounty reports","Define and enforce secure SDLC practices across engineering squads","Own SAST/DAST tooling and integrate into CI/CD pipelines"]')
info "RKavach job 1 (featured): $RKJOB1_ID"

RKJOB2_ID=$(create_job "$RKAVACH_ID" \
  "Cloud Security Architect" "cloud-security-architect-rkavach" "FULL_TIME" "REMOTE" "SENIOR" "true" \
  "RKavach needs a Cloud Security Architect to define the security blueprint for our multi-cloud environment. You will own zero-trust architecture, cloud IAM strategy, and compliance automation." \
  '["5+ years cloud security architecture experience","AWS Security Specialty and/or CCSP required","Strong Terraform and Python skills for security automation","Experience designing zero-trust and least-privilege IAM architectures","Prior experience with CSPM tools such as Wiz, Prisma Cloud, or Lacework"]' \
  '["Design and implement zero-trust network architecture across AWS and Azure","Own IAM strategy, privilege access management, and identity federation","Build cloud security guardrails using infrastructure-as-code","Drive compliance automation for ISO 27001 and SOC 2","Mentor cloud and DevOps engineers on security best practices"]')
info "RKavach job 2 (featured): $RKJOB2_ID"

RKJOB3_ID=$(create_job "$RKAVACH_ID" \
  "Cyber Risk & Compliance Manager" "cyber-risk-compliance-manager-rkavach" "FULL_TIME" "HYBRID" "SENIOR" "true" \
  "RKavach is looking for a Cyber Risk & Compliance Manager to lead our internal GRC program and support enterprise clients through certification and regulatory audits." \
  '["5+ years GRC or information security management experience","Demonstrated ISO 27001 Lead Auditor or CISM/CISSP credential","Deep understanding of RBI cyber security framework, SEBI guidelines, and DPDP Act","Experience managing external audit relationships and evidence collection","Excellent stakeholder management and executive communication skills"]' \
  '["Own and drive ISO 27001 certification and SOC 2 Type II audit","Manage enterprise risk register and risk appetite framework","Lead external auditor engagements and coordinate evidence collection","Deliver compliance reporting and risk briefings to the CISO and board","Develop and maintain security policies, procedures, and training programmes"]')
info "RKavach job 3 (featured): $RKJOB3_ID"

RKJOB4_ID=$(create_job "$RKAVACH_ID" \
  "Mobile & API Penetration Tester" "mobile-api-penetration-tester-rkavach" "FULL_TIME" "HYBRID" "MID" "false" \
  "RKavach's offensive security team is growing. We need a Mobile & API Penetration Tester to own assessments of Android/iOS applications and RESTful/GraphQL APIs for our enterprise clientele." \
  '["2+ years mobile or API penetration testing experience","Proficiency with Frida, Objection, MobSF, and Burp Suite","Strong understanding of iOS/Android security models","Familiarity with API authentication schemes (OAuth 2.0, JWT, API keys)","eMAPT, GPEN, or equivalent certification preferred"]' \
  '["Conduct mobile application security assessments on Android and iOS","Perform REST and GraphQL API security testing","Use dynamic and static analysis to uncover vulnerabilities in compiled apps","Write clear technical and executive-grade reports","Stay current on mobile exploitation techniques and bypass methods"]')
info "RKavach job 4: $RKJOB4_ID"

# Attach skills to jobs
attach_skill() {
  local jid="$1" sid="$2"
  [ -z "$jid" ] || [ -z "$sid" ] && return
  run_sql_multi "INSERT INTO job_skills (id, \"jobId\", \"skillId\") VALUES (gen_random_uuid(), '$jid', '$sid') ON CONFLICT DO NOTHING;" 2>/dev/null || true
}

for jid in "$RJOB1_ID" "$RKJOB1_ID" "$RKJOB4_ID"; do
  attach_skill "$jid" "$SKILL_PENTEST"
  attach_skill "$jid" "$SKILL_BURP"
  attach_skill "$jid" "$SKILL_PYTHON"
  attach_skill "$jid" "$SKILL_OWASP"
done
for jid in "$RKJOB1_ID"; do
  attach_skill "$jid" "$SKILL_APPSEC"
done
for jid in "$RKJOB2_ID"; do
  attach_skill "$jid" "$SKILL_AWS"
  attach_skill "$jid" "$SKILL_CLOUDSEC"
  attach_skill "$jid" "$SKILL_TERRAFORM"
done

# ── 7. Seeker ──────────────────────────────────────────────────────────────────
step "Creating seeker..."
SEEKER_USER_ID=$(run_sql "SELECT id FROM users WHERE email='yograjhukumdar0@gmail.com' LIMIT 1;")

if [ -z "$SEEKER_USER_ID" ]; then
  SEEKER_USER_ID=$(run_sql "
    INSERT INTO users (id, email, password, \"firstName\", \"lastName\", role, status, \"isEmailVerified\", \"emailVerifiedAt\", \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), 'yograjhukumdar0@gmail.com', '$SEEKER_HASH', 'Yograj', 'Dev', 'SEEKER', 'ACTIVE', true, now(), now(), now())
    RETURNING id;")
  info "Created seeker: $SEEKER_USER_ID"
else
  info "Seeker already exists: $SEEKER_USER_ID"
fi

SEEKER_PROFILE_ID=$(run_sql "SELECT id FROM job_seeker_profiles WHERE \"userId\"='$SEEKER_USER_ID' LIMIT 1;")
if [ -z "$SEEKER_PROFILE_ID" ]; then
  SEEKER_PROFILE_ID=$(run_sql "
    INSERT INTO job_seeker_profiles (id, \"userId\", \"firstName\", \"lastName\", title, \"professionalSummary\", \"profileCompletion\", \"createdAt\", \"updatedAt\")
    VALUES (gen_random_uuid(), '$SEEKER_USER_ID', 'Yograj', 'Dev', 'Security Engineer', 'Cybersecurity professional with 3 years experience in penetration testing and application security.', 60, now(), now())
    RETURNING id;")
  info "Created profile: $SEEKER_PROFILE_ID"
fi

# ── 8. Search suggestions ──────────────────────────────────────────────────────
step "Seeding search suggestions..."
ADMIN_ID=$(run_sql "SELECT id FROM admins ORDER BY \"createdAt\" ASC LIMIT 1;")
if [ -n "$ADMIN_ID" ]; then
  run_sql_multi "
    INSERT INTO search_suggestions (id, text, type, \"isActive\", \"createdBy\", \"createdAt\", \"updatedAt\")
    SELECT gen_random_uuid(), name, 'ROLE', true, '$ADMIN_ID', now(), now()
    FROM roles WHERE name IS NOT NULL AND \"isActive\" = true
    ON CONFLICT (text, type) DO NOTHING;"

  run_sql_multi "
    INSERT INTO search_suggestions (id, text, type, \"isActive\", \"createdBy\", \"createdAt\", \"updatedAt\")
    SELECT gen_random_uuid(), name, 'SKILL', true, '$ADMIN_ID', now(), now()
    FROM skills WHERE name IS NOT NULL AND \"isActive\" = true
    ON CONFLICT (text, type) DO NOTHING;"

  run_sql_multi "
    INSERT INTO search_suggestions (id, text, type, \"isActive\", \"createdBy\", \"createdAt\", \"updatedAt\")
    SELECT gen_random_uuid(), \"companyName\", 'COMPANY', true, '$ADMIN_ID', now(), now()
    FROM employers WHERE \"companyName\" IS NOT NULL AND \"isVerified\" = true
    ON CONFLICT (text, type) DO NOTHING;"

  ROLE_COUNT=$(run_sql "SELECT COUNT(*) FROM search_suggestions WHERE type='ROLE';")
  SKILL_COUNT=$(run_sql "SELECT COUNT(*) FROM search_suggestions WHERE type='SKILL';")
  COMPANY_COUNT=$(run_sql "SELECT COUNT(*) FROM search_suggestions WHERE type='COMPANY';")
  info "Suggestions: $ROLE_COUNT roles, $SKILL_COUNT skills, $COMPANY_COUNT companies"
else
  warn "No admin found — skipping search suggestions (run reset-db.sh first)"
fi

# ── 9. Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "   Seed Complete"
echo "================================================"
echo ""
echo "  RIVEDIX (yograj.hukumdar@rivedix.com)"
echo "    Password: Rivedix@2025!"
echo "    Subscription: Free"
echo "    Jobs: Penetration Tester, Cyber GRC Analyst"
echo ""
echo "  RKAVACH (support@rkavach.com)"
echo "    Password: RKavach@2025!"
echo "    Subscription: Growth (1 year)"
echo "    Jobs:"
echo "      [FEATURED] Product Security Engineer"
echo "      [FEATURED] Cloud Security Architect"
echo "      [FEATURED] Cyber Risk & Compliance Manager"
echo "               Mobile & API Penetration Tester"
echo ""
echo "  SEEKER (yograjhukumdar0@gmail.com / Test@1234)"
echo "================================================"
