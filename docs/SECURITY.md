# Security Review & Hardening Guide (Tripman)

_Last updated: 2026-02-03_

This document is the **security baseline** for Tripman: current posture, risks, recommended fixes, and how to verify we’re protected against common attack classes (SQL injection, account takeover, payment abuse, cookie theft, etc.).

> Goal: launch safely with **practical, high-impact** protections—without overengineering.

---

## 1) Threat model (what we must protect)

### 1.1 Assets

- **Customer data**: name, email, phone, pickup location, notes.
- **Bookings**: schedule integrity (prevent fake / duplicate / unpaid bookings).
- **Payments**: ensure a user cannot “book without paying” (when Stripe is live).
- **Admin panel**: full access to bookings, cancellations, refunds, availability blocks/rules.
- **Operational secrets**: `DATABASE_URL`, `ADMIN_SESSION_SECRET`, Stripe keys, Resend key, Google private key, tracking secret.

### 1.2 Trust boundaries

- **Public site** (unauthenticated): homepage, availability, booking create.
- **Admin area**: `/admin/*` UI + `/api/admin/*` endpoints.
- **3rd party webhooks**: Stripe webhook, Calendar webhook(s).
- **Client vs server**: client code is untrusted; only server should enforce rules.

### 1.3 Adversaries we assume

- **Script kiddies / bots**: brute-force admin login, spam bookings.
- **Fraudsters**: attempt to reserve time slots without paying.
- **Data miners**: scrape booking/tracking endpoints.
- **Insiders**: access to env vars, admin account misuse.

### 1.4 Out-of-scope (explicitly)

- A nation-state attacker (we’ll still follow best practices, but we won’t design for that threat level).
- Compromised end-user devices (we can reduce blast radius but can’t “secure” the user’s phone).

---

## 2) Current security posture (what exists today)

### 2.1 Admin authentication

- Admin session cookie: `admin_session`
- Signed on the server with `ADMIN_SESSION_SECRET` (HMAC-SHA256)
- Cookie flags (good):
  - `HttpOnly: true` (JS can’t read)
  - `Secure: true` in production
  - `SameSite: Lax`
- Middleware gates `/admin/*` navigation, while API routes use server verification via `requireAdmin()`.

### 2.2 Input validation & SQL injection

- Prisma is used for DB access → **SQL injection risk is low** when using Prisma query APIs.
- Some endpoints use `zod` schemas for request parsing (good).

### 2.3 Booking/tracking access control

- Several sensitive customer endpoints use **lightweight access checks** (customer email verification / admin bypass).
- Tracking update endpoints require **admin session** or a **shared secret header** (good pattern).

### 2.4 Known security gaps (important)

- **Rate limiting**: no strong IP-based throttling yet (booking, admin login, contact form).
- **Payments gating**: ensure **no free booking** once Stripe is enabled (see section 7).
- **Admin brute force**: relies on password strength + cookie secret; should add lockouts/rate limits.
- **CSP/security headers**: not explicitly hardened in one place (needs review).
- **Audit logging**: admin actions (cancel/refund/availability changes) should be logged.

---

## 3) How to check if we currently have “security openings”

### 3.1 Quick checks (no code changes)

- **Vercel logs**: look for spikes in `/api/admin/session`, `/api/booking`, `/api/contact`.
- **Neon logs**: check unusual query rates / connections.
- **Stripe dashboard** (when live): disputes, repeated failed payments, suspicious velocity.
- **Resend**: bounces/spam complaints.

### 3.2 Code checks (what to search for)

- Public endpoints returning too much:
  - Search for `NextResponse.json(` with Booking objects and ensure no PII leakage.
- Missing auth:
  - Ensure every `/api/admin/*` route calls `requireAdmin`.
- Webhooks:
  - Ensure webhook signature verification is required and enforced.

### 3.3 Practical attacker simulation (recommended before launch)

Run a small checklist as if you were an attacker:

- **Admin brute force**: try 20 wrong passwords quickly → does the app slow down or lock out?
- **Booking spam**: try 30 booking POSTs in 60 seconds → does it accept all?
- **Availability hammer**: refresh availability endpoint rapidly → do we hit Google API or CPU spikes?
- **Unpaid booking**: confirm a booking can’t be confirmed without Stripe success (once Stripe is live).

---

## 4) SQL injection: are we vulnerable?

### 4.1 Short answer

**Low risk** if we stick to Prisma’s query builder APIs. Prisma parameterizes queries.

### 4.2 When SQLi becomes a problem anyway

SQL injection can still happen if we ever:

- Use `$queryRawUnsafe`, string concatenation, or raw SQL with user input.
- Build dynamic `orderBy` / field names from user input without allowlists.

### 4.3 Mitigation checklist

- Ban unsafe raw SQL (or wrap it with strict allowlists).
- Keep `zod` validation on all request bodies and query params.

### 4.4 How to test for SQLi

- If any endpoint uses raw SQL, try payloads like:
  - `' OR 1=1 --`
  - `'; DROP TABLE "Booking"; --`
- Expectation: requests should fail validation before reaching DB, or be safely parameterized.

---

## 5) XSS, injection into emails, and “phishing-like” abuse

### 5.1 XSS (Cross-Site Scripting)

Primary sources:

- Rendering user-provided strings (`notes`, `pickup`) into HTML.
- Any `dangerouslySetInnerHTML`.

**Mitigations**

- Avoid `dangerouslySetInnerHTML`.
- React escapes strings by default (good) — keep it that way.
- If we ever render rich text, sanitize with a proven sanitizer.

### 5.2 Email template injection

If we inject raw user input into HTML emails:

- Risk: broken HTML, malicious links, or misleading content.

**Mitigations**

- Escape/sanitize user-provided fields when inserting into HTML.
- Keep “reply-to” as the customer email, but **never** let customer control `from`.

### 5.3 “Phishing” via the platform

Attackers might use the contact form to send spam-like content to your admin email.

**Mitigations**

- Rate limit `/api/contact`.
- Add honeypot field or CAPTCHA (Turnstile recommended).
- Block obvious spam patterns server-side.

### 5.4 SSRF (Server-Side Request Forgery) & external fetch risks

Tripman calls external services (e.g., Google Calendar, Nominatim if re-enabled, Stripe webhooks).
SSRF risk increases if we ever allow users to control URLs that the server fetches.

**Mitigations**

- Never fetch arbitrary user-provided URLs.
- If we need user-provided URLs, use an allowlist of hostnames.
- Set timeouts and size limits on fetches to avoid resource exhaustion.

---

## 6) Admin panel threats and mitigations

### 6.1 Brute force login attempts

**Risk**: attackers try thousands of passwords.

**Mitigations (recommended)**

- Rate-limit `/api/admin/session` by IP (e.g. 10/min).
- Add incremental backoff / temporary lockout after N failures (per IP + per email).
- Use a strong admin password (>= 16 chars) and rotate periodically.

### 6.2 Cookie theft / session hijacking

**Risk**: stolen cookie gives admin access until expiry.

**Existing mitigations**

- `HttpOnly` and `Secure` in prod are good.

**Additional mitigations**

- Shorten TTL (e.g. 4h) + “re-auth for sensitive actions” (refunds).
- Bind sessions to a server-side record (optional) and revoke on logout.
- Add CSP + avoid XSS vectors.

### 6.3 CSRF

SameSite=Lax reduces CSRF risk, but admin endpoints should still be careful.

**Mitigations**

- Ensure state-changing admin routes are not callable cross-site:
  - keep `SameSite=Lax`
  - require JSON `Content-Type`
  - optionally add CSRF token for admin UI actions

### 6.4 Clickjacking (UI redress)

Attackers can iframe the admin UI and trick clicks (rare but real).

**Mitigations**

- Add security headers:
  - `Content-Security-Policy: frame-ancestors 'none'` (or at least for `/admin`)
  - or `X-Frame-Options: DENY` (legacy but still useful)

---

## 7) Payments & “book without paying” (critical before live Stripe)

### 7.1 Attack scenario

User creates bookings without paying, or pays once and reuses that “success” signal.

### 7.2 Required architecture (recommended)

- Create booking with status `PENDING`
- Create Stripe PaymentIntent tied to bookingId
- Only mark booking `CONFIRMED` when Stripe webhook `payment_intent.succeeded` arrives
- Reject confirmation if:
  - PaymentIntent metadata bookingId mismatch
  - Amount/currency mismatch
  - EventType mismatch

### 7.3 Prevent double booking / slot sniping

- Use a **short hold** (e.g. 10 minutes):
  - when user starts checkout, create a “held” record or a lock
  - release lock on payment failure/timeout

### 7.4 Refund security

Refund endpoints must be admin-only.

- Log refund actions (who, when, amount, reason).
- Use Stripe idempotency keys for refund calls.

### 7.5 Webhook hardening checklist

- Verify Stripe webhook signature (must).
- Reject events without `bookingId` metadata.
- Ensure the booking exists and is still `PENDING`.
- Ensure `amount` matches the expected price for that booking/eventType.
- Make webhook idempotent:
  - ignore already-confirmed bookings
  - store processed event IDs if necessary

---

## 8) API abuse / DoS

### 8.1 Risk

Attackers can:

- Hammer `/api/availability` to burn CPU and Google API quotas
- Spam `/api/booking` to fill your DB

### 8.2 Mitigations (recommended)

- Add rate limiting on:
  - `/api/availability`
  - `/api/booking`
  - `/api/contact`
  - `/api/admin/session`
- Add caching for availability (short TTL) when safe.
- Add request size limits and timeouts for 3rd-party fetches.

### 8.3 Suggested rate limit policy (starting point)

- `/api/admin/session`: **10/min/IP**, burst 5
- `/api/booking`: **5/min/IP**, burst 3 (and consider per-email limits)
- `/api/contact`: **5/min/IP**
- `/api/availability`: **30/min/IP** (cache where possible)

---

## 9) Secrets management & deployment hygiene

### 9.1 Rules

- Never commit `.env.local`
- Rotate secrets if leaked:
  - `ADMIN_SESSION_SECRET`
  - Stripe secret keys + webhook secret
  - Resend key
  - Google private key

### 9.2 Vercel settings

- Use **Production** env vars for production.
- Limit who has access to env vars.
- Enable deployment protection if needed.

### 9.3 Database hardening (Neon/Postgres)

- Use least-privilege DB users if possible (separate admin scripts vs app runtime).
- Ensure `sslmode=require` in `DATABASE_URL`.
- Rotate DB password if leaked.
- Use connection pooling for serverless stability.

---

## 10) Logging, monitoring, and incident response

### 10.1 Minimum monitoring for launch

- Error tracking: Sentry (frontend + server)
- Logs: Vercel logs + optional log drain (Logtail/Axiom)
- Uptime check: simple health endpoint + external monitor

### 10.2 Incident “first response”

- Lock down admin credentials (rotate password, rotate session secret).
- Disable bookings temporarily (feature flag / scheduler mode off).
- Investigate logs for:
  - `POST /api/admin/session` spikes
  - `POST /api/booking` spikes
  - webhook failures

### 10.3 What to log (without leaking PII)

Log **events**, not raw payloads:

- `booking_created` (bookingId, eventTypeId, startsAt, ip hash)
- `booking_confirmed` (bookingId, stripePaymentIntentId)
- `booking_cancelled` (bookingId, actor=customer/admin, refund=true/false)
- `admin_login_failed` (email hash, ip hash)
- `admin_login_success` (adminUserId, ip hash)

---

## 11) Recommended security backlog (prioritized)

### P0 (before live payments)

- Convert booking to `PENDING` until Stripe succeeds
- Add rate limiting for booking + admin login
- Add audit logs for admin cancel/refund/block

### P1 (soon after)

- Add bot protection (Turnstile) to booking/contact
- Tighten security headers (CSP)
- Add “re-auth required” for refunds

### P2 (later)

- Admin MFA (best via identity provider)
- Session revocation store
- Advanced fraud detection (Stripe Radar rules)

---

## 12) Appendix: quick “are we secure?” checklist

- [ ] All `/api/admin/*` routes call `requireAdmin()`
- [ ] Admin cookie has `HttpOnly`, `Secure` in prod, `SameSite=Lax`
- [ ] Booking cannot become `CONFIRMED` without Stripe success
- [ ] Availability and booking endpoints are rate-limited
- [ ] Webhook signature verification is enforced
- [ ] PII is not returned publicly without authorization
- [ ] Secrets are only in env vars (not in repo)
- [ ] Monitoring is configured (errors + logs)

---

## 13) Common attack examples (what it looks like in real life)

### 13.1 SQL injection attempt

Attacker tries to inject into query params/body fields to bypass checks.

- Mitigation: Prisma + validation.
- Detection: spikes in 400/500, suspicious strings in logs (do not log raw PII).

### 13.2 Credential stuffing (admin)

Attacker reuses leaked passwords across websites.

- Mitigation: strong password, rate limiting, lockout, optional MFA.
- Detection: many failed logins across many IPs.

### 13.3 Payment bypass / unpaid booking

Attacker calls booking endpoint directly and skips payment UI.

- Mitigation: PENDING until webhook success.
- Detection: confirmed bookings without payment intent id.

### 13.4 Cookie theft

Attacker steals session cookie via XSS or compromised device.

- Mitigation: prevent XSS, HttpOnly+Secure cookies, short TTL.
- Detection: admin actions from unusual IP/geo.

### 13.5 CSRF (admin actions)

Attacker tricks admin into clicking a link that triggers a POST in background.

- Mitigation: SameSite cookies, origin checks, CSRF token for admin state changes.

---

## 14) Security headers (recommended baseline)

At minimum, consider:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy` (start in report-only, then enforce)
  - Also set `frame-ancestors 'none'` (or at least for `/admin`)

> CSP can break embeds/scripts if too strict. Roll out carefully: start with Report-Only.
