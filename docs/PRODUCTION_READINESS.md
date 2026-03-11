# Production Readiness Checklist

_Last updated: 2026-03-11_

Use this checklist before deploying to Vercel or any production environment.

---

## 1. Tests

- [x] **Unit tests pass**: `npm test` — 28 tests across lib, components
- [x] **Accessibility tests**: jest-axe on Hero, Footer, BecomePassenger
- [ ] **Manual E2E**: Full booking flow (select package → date → form → payment)
- [ ] **Cross-browser**: Chrome, Safari, Firefox, Edge

---

## 2. Security

- [x] **Security headers**: HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options (see `next.config.ts`)
- [x] **Input validation**: Zod schemas on booking, payment, contact APIs
- [x] **Server-side pricing**: Amount computed server-side, never trusted from client
- [x] **Admin auth**: Session cookie HttpOnly, Secure, SameSite
- [ ] **Rate limiting**: Consider adding for `/api/booking`, `/api/contact`, `/api/admin/session`
- [x] **npm audit**: 0 vulnerabilities (Next.js 15.5.12)

---

## 3. Accessibility (Ontario AODA)

- [x] **Skip link**: "Skip to main content" for keyboard users
- [x] **Viewport zoom**: `userScalable: true`, `maximumScale: 5`
- [x] **Reduced motion**: `prefers-reduced-motion` respected in CSS
- [x] **Semantic HTML**: `ul`/`li`, `nav`, `footer`, `section`, headings
- [x] **ARIA labels**: Buttons, links, regions
- [x] **Focus states**: Visible focus rings on interactive elements
- [ ] **Screen reader**: Manual test with NVDA/VoiceOver

---

## 4. Mobile & UX

- [x] **Responsive**: Tailwind breakpoints, mobile-first
- [x] **Touch targets**: min 44px for buttons (globals.css)
- [x] **Font size**: 16px on inputs to prevent iOS zoom
- [x] **Smooth scroll**: `scroll-behavior: smooth`
- [ ] **Lighthouse**: Run on mobile and desktop (Performance, Accessibility, Best Practices)

---

## 5. Performance

- [x] **Next.js Image**: Used for hero, logo
- [x] **Priority loading**: Hero image has `priority`
- [x] **Analytics**: Vercel Analytics + Speed Insights
- [ ] **Core Web Vitals**: Monitor LCP, FID, CLS in production

---

## 6. Environment & Config

- [ ] **Vercel env vars**: See `.env.example` for full list. Copy to Vercel env.
- [ ] **Database**: Run `npm run db:seed:production` after deploy
- [ ] **Stripe**: Webhook URL set, test mode vs live mode
- [ ] **Instagram** (optional): `IG_USER_ID`, `IG_USER_TOKEN`, `FB_APP_ID`, `FB_APP_SECRET`

---

## 7. Content & Legal

- [x] **Privacy Policy**: `/privacy`
- [x] **Terms of Service**: `/terms` — pricing (70 CAD, 270 CAD) documented
- [x] **Sitemap**: Includes `/`, `/privacy`, `/terms`
- [ ] **Cookie consent**: If using non-essential cookies, add banner

---

## 8. Pre-Deploy Commands

```bash
npm run build          # Must succeed
npm test               # All tests pass
npm run db:seed:production   # After first deploy (with DATABASE_URL set)
```

---

## Quick Reference

| Area          | Status | Notes                               |
| ------------- | ------ | ----------------------------------- |
| Tests         | ✅     | 28 passing                          |
| Security      | ✅     | Headers, validation, server pricing |
| Accessibility | ✅     | AODA-aligned                        |
| Mobile        | ✅     | Responsive, touch-friendly          |
| Performance   | ✅     | Image optimization                  |
| Rate limit    | ⚠️     | Consider for launch                 |
