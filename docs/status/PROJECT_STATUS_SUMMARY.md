# The TripMan — Project Status (Canonical)

_Last updated: 2026-02-03_

This is the single source of truth for **where we are**, **what is done**, and **what’s next**.

## ✅ Current state (what is working)

- **Production site**: live on Vercel + custom domain (`thetripman.com`)
- **Homepage flow**: “Become a Passenger” is the **only** package selector (no duplicate pricing sections)
- **Booking calendar (customer)**:
  - **Toronto-only** time zone (`America/Toronto`)
  - Cal.com-like layout (date grid + time list)
  - **Hourly slots** + enforced travel buffer between bookings
  - Mobile date selection fixed (tap-to-pick)
- **Availability management (admin)**:
  - Recurring rules + one-off blocks
  - Visual calendar for blocks/bookings
  - Prevents blocks overlapping non-canceled bookings
  - Past bookings hidden by default (toggle to show)
- **Admin auth**:
  - Cookie-based session (`admin_session`), server-signed, HttpOnly, SameSite=Lax, Secure in production
  - `/admin/*` gated by middleware + server-side checks via `requireAdmin()`
  - Admin can update email/password via admin settings endpoint
- **Emails (Resend)**:
  - Booking confirmation styling aligned with Tripman green header
- **Content/legal**:
  - Privacy Policy + Terms pages are replaced with launch-ready copy
- **Pickup location**:
  - **Required** (UI + API)
  - Autocomplete was removed (unreliable); service-area note is shown instead

## ⚠️ Known gaps / decisions

- **Payments**:
  - Stripe endpoints exist, but the **booking→payment→confirm** flow still needs hard gating.
  - Security recommendation: bookings should not be `CONFIRMED` until Stripe succeeds.
- **Rate limiting / abuse protection**:
  - No robust IP-based throttling yet for public endpoints (booking / contact / tracking).
- **Monitoring**:
  - No centralized error tracking/log retention (Sentry/Logtail) configured yet.

## 🔜 Next work (planned)

### Payments (Stripe)

- Lock slot → create `PENDING` booking → collect payment → confirm via webhook.
- Prevent “free booking” / replay / double-submit.

### Security hardening

- Add rate limiting + basic bot protection on sensitive endpoints.
- Add audit logging for admin actions (cancel/block).
- Review CSP/security headers and tighten.

### Google Calendar integration (optional but recommended)

- Connect service account for free/busy and event creation for confirmed bookings.

## 📌 Where to look

- **Setup & env**: `docs/setup/08_ENV_AND_API_SETUP.md`
- **Testing checklist**: `docs/setup/07_TESTING_AND_LAUNCH.md`
- **Security hardening**: `docs/SECURITY.md`
